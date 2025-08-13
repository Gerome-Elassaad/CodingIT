import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { createUsageMiddleware } from '@/lib/usage-tracker'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check GitHub import limits before proceeding
    const usageMiddleware = createUsageMiddleware('github_imports', 1)
    
    try {
      const { trackUsage, remainingUsage } = await usageMiddleware(session.user.id)
      
      const body = await request.json()
      const { owner, repo, importFiles = true } = body

      if (!owner || !repo) {
        return NextResponse.json({ error: 'Owner and repo are required' }, { status: 400 })
      }

      // Get GitHub integration
      const { data: integration } = await supabase
        .from('user_integrations')
        .select('connection_data')
        .eq('user_id', session.user.id)
        .eq('service_name', 'github')
        .eq('is_connected', true)
        .single()

      if (!integration?.connection_data?.access_token) {
        return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 })
      }

      // Get repository details
      const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          'Authorization': `Bearer ${integration.connection_data.access_token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'CodingIT-App/1.0',
        },
      })

      if (!repoResponse.ok) {
        if (repoResponse.status === 404) {
          return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
        }
        return NextResponse.json({ error: 'Failed to fetch repository' }, { status: 500 })
      }

      const repoData = await repoResponse.json()
      
      // Check repository size (in KB, limit to plan's storage limit)
      const repoSizeMB = Math.ceil(repoData.size / 1024) // Convert KB to MB
      
      // Create a new project for the imported repository
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: session.user.id,
          title: `${repoData.name} (GitHub Import)`,
          description: repoData.description || `Imported from ${repoData.full_name}`,
          template_id: 'github-import',
          metadata: {
            github_repo: {
              id: repoData.id,
              full_name: repoData.full_name,
              html_url: repoData.html_url,
              clone_url: repoData.clone_url,
              language: repoData.language,
              size: repoData.size,
              imported_at: new Date().toISOString()
            }
          }
        })
        .select()
        .single()

      if (projectError || !project) {
        console.error('Error creating project:', projectError)
        return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
      }

      let importedFiles = []

      if (importFiles) {
        // Fetch repository contents
        const contentsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, {
          headers: {
            'Authorization': `Bearer ${integration.connection_data.access_token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'CodingIT-App/1.0',
          },
        })

        if (contentsResponse.ok) {
          const contents = await contentsResponse.json()
          importedFiles = await fetchRepositoryFiles(
            integration.connection_data.access_token,
            owner,
            repo,
            contents,
            project.id,
            session.user.id
          )
        }
      }

      // Track the GitHub import usage
      await trackUsage()

      return NextResponse.json({
        success: true,
        project: {
          id: project.id,
          title: project.title,
          description: project.description
        },
        repository: {
          name: repoData.name,
          full_name: repoData.full_name,
          html_url: repoData.html_url,
          language: repoData.language,
          size: repoData.size
        },
        imported_files_count: importedFiles.length,
        remaining_imports: remainingUsage
      })

    } catch (usageError: any) {
      if (usageError.code === 'FEATURE_LIMIT_EXCEEDED') {
        return NextResponse.json({
          error: usageError.message,
          code: usageError.code,
          currentUsage: usageError.currentUsage,
          limit: usageError.limit,
          upgradeRequired: usageError.upgradeRequired
        }, { status: 429 })
      }
      throw usageError
    }

  } catch (error) {
    console.error('GitHub import error:', error)
    return NextResponse.json({ error: 'Import failed' }, { status: 500 })
  }
}

async function fetchRepositoryFiles(
  accessToken: string,
  owner: string,
  repo: string,
  contents: any[],
  projectId: string,
  userId: string,
  path: string = ''
): Promise<any[]> {
  const supabase = createServerClient()
  const files = []

  for (const item of contents.slice(0, 50)) { // Limit to 50 files per request
    if (item.type === 'file' && item.size < 1048576) { // Skip files larger than 1MB
      try {
        const fileResponse = await fetch(item.download_url || item.url, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'CodingIT-App/1.0',
          },
        })

        if (fileResponse.ok) {
          let content = ''
          
          if (item.download_url) {
            content = await fileResponse.text()
          } else {
            const fileData = await fileResponse.json()
            content = fileData.content ? atob(fileData.content) : ''
          }

          // Create fragment for the file
          const { data: fragment, error } = await supabase
            .from('fragments')
            .insert({
              user_id: userId,
              project_id: projectId,
              title: item.name,
              description: `File imported from GitHub: ${owner}/${repo}`,
              template: 'code-interpreter-v1', // Default template
              code: content,
              file_path: item.path,
              metadata: {
                github_import: true,
                original_path: item.path,
                file_size: item.size,
                imported_at: new Date().toISOString()
              }
            })
            .select()
            .single()

          if (!error && fragment) {
            files.push({
              name: item.name,
              path: item.path,
              size: item.size,
              fragment_id: fragment.id
            })
          }
        }
      } catch (error) {
        console.warn(`Failed to import file ${item.path}:`, error)
      }
    } else if (item.type === 'dir' && files.length < 100) { // Recursively fetch directories, limit total files
      try {
        const dirResponse = await fetch(item.url, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'CodingIT-App/1.0',
          },
        })

        if (dirResponse.ok) {
          const dirContents = await dirResponse.json()
          const subFiles = await fetchRepositoryFiles(
            accessToken,
            owner,
            repo,
            dirContents,
            projectId,
            userId,
            item.path
          )
          files.push(...subFiles)
        }
      } catch (error) {
        console.warn(`Failed to fetch directory ${item.path}:`, error)
      }
    }
  }

  return files
}