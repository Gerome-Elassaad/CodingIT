'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { useToast } from './ui/use-toast'
import { 
  Github, 
  Search, 
  Download, 
  Loader2, 
  RefreshCw,
  Star,
  GitFork,
  Calendar,
  FileText,
  Folder,
  ExternalLink
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { ScrollArea } from './ui/scroll-area'
import { useUpgradeDialog } from './upgrade-dialog'
import { API_BASE_URL } from '@/lib/config'

interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string
  html_url: string
  clone_url: string
  private: boolean
  fork: boolean
  language: string
  stargazers_count: number
  forks_count: number
  updated_at: string
  owner: {
    login: string
    avatar_url: string
  }
}

interface UsageLimits {
  can_import: boolean
  current_usage: number
  limit: number
  is_unlimited: boolean
  plan_name: string
  upgrade_required: boolean
}

interface GitHubImportProps {
  onImport?: (repo: GitHubRepo, files: any[]) => void
  onClose?: () => void
}

export function GitHubImport({ onImport, onClose }: GitHubImportProps) {
  const { session } = useAuth(() => {}, () => {})
  const { toast } = useToast()
  const { UpgradeDialog, openUpgradeDialog } = useUpgradeDialog()
  
  const [repositories, setRepositories] = useState<GitHubRepo[]>([])
  const [usageLimits, setUsageLimits] = useState<UsageLimits | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  const loadRepositories = useCallback(async () => {
    if (!session?.user?.id) return

    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/integrations/github/repos`)
      if (!response.ok) {
        throw new Error('Failed to fetch repositories')
      }
      
      const data = await response.json()
      setRepositories(data.repositories || [])
      setUsageLimits(data.usage_limits || null)
    } catch (error) {
      console.error('Error loading repositories:', error)
      toast({
        title: "Error",
        description: "Failed to load GitHub repositories. Please check your connection.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id, toast])

  const importRepository = async (repo: GitHubRepo) => {
    if (!session?.user?.id) return

    // Check if user can import more repositories
    if (usageLimits && !usageLimits.can_import) {
      openUpgradeDialog({
        currentPlan: usageLimits.plan_name,
        featureBlocked: {
          type: 'github_imports',
          currentUsage: usageLimits.current_usage,
          limit: usageLimits.limit
        },
        triggerReason: 'feature_limit'
      })
      return
    }

    setIsImporting(true)
    setSelectedRepo(repo)
    
    try {
      // Use the new import API endpoint
      const response = await fetch(`${API_BASE_URL}/api/integrations/github/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: repo.owner.login,
          repo: repo.name,
          importFiles: true
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 429 && errorData.code === 'FEATURE_LIMIT_EXCEEDED') {
          openUpgradeDialog({
            currentPlan: usageLimits?.plan_name || 'free',
            featureBlocked: {
              type: 'github_imports',
              currentUsage: errorData.currentUsage,
              limit: errorData.limit
            },
            triggerReason: 'feature_limit'
          })
          return
        }
        throw new Error(errorData.error || 'Failed to import repository')
      }
      
      const data = await response.json()
      
      toast({
        title: "Success",
        description: `Successfully imported ${repo.name} with ${data.imported_files_count} files. ${data.remaining_imports === -1 ? 'Unlimited imports remaining' : `${data.remaining_imports} imports remaining this month`}.`,
      })
      
      // Update usage limits
      if (usageLimits) {
        setUsageLimits({
          ...usageLimits,
          current_usage: usageLimits.current_usage + 1,
          can_import: data.remaining_imports !== 0
        })
      }
      
      if (onImport) {
        onImport(repo, []) // Files are now handled by the API
      }
      
    } catch (error) {
      console.error('Error importing repository:', error)
      toast({
        title: "Error",
        description: typeof error === 'object' && error && 'message' in error ? error.message as string : "Failed to import repository. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
      setSelectedRepo(null)
    }
  }

  const fetchAllFiles = async (owner: string, repo: string, contents: any[], path = ''): Promise<any[]> => {
    const files: any[] = []
    
    for (const item of contents) {
      if (item.type === 'file') {
        try {
          const fileResponse = await fetch(
            `${API_BASE_URL}/api/integrations/github/repos/${owner}/${repo}?path=${item.path}`
          )
          
          if (fileResponse.ok) {
            const fileData = await fileResponse.json()
            files.push({
              name: item.name,
              path: item.path,
              content: fileData.content?.content ? atob(fileData.content.content) : '',
              size: item.size,
              type: 'file'
            })
          }
        } catch (error) {
          console.warn(`Failed to fetch file ${item.path}:`, error)
        }
      } else if (item.type === 'dir') {
        try {
          const dirResponse = await fetch(
            `${API_BASE_URL}/api/integrations/github/repos/${owner}/${repo}?path=${item.path}`
          )
          
          if (dirResponse.ok) {
            const dirData = await dirResponse.json()
            const subFiles = await fetchAllFiles(owner, repo, dirData.contents || [], item.path)
            files.push(...subFiles)
          }
        } catch (error) {
          console.warn(`Failed to fetch directory ${item.path}:`, error)
        }
      }
    }
    
    return files
  }

  useEffect(() => {
    loadRepositories()
  }, [session?.user?.id, loadRepositories])

  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!session?.user?.id) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub Import
          </CardTitle>
          <CardDescription>
            Please log in to import repositories from GitHub.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            <CardTitle>Import from GitHub</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadRepositories}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
            {onClose && (
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>
        <CardDescription>
          Select a repository to import into your workspace.
          {usageLimits && (
            <span className="block mt-2">
              <Badge variant={usageLimits.can_import ? "secondary" : "destructive"} className="mr-2">
                {usageLimits.current_usage} / {usageLimits.is_unlimited ? '∞' : usageLimits.limit} imports used
              </Badge>
              {usageLimits.plan_name === 'free' && (
                <span className="text-xs text-muted-foreground">
                  Upgrade to Pro for more imports
                </span>
              )}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search repositories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredRepositories.map((repo) => (
                  <Card key={repo.id} className="relative">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-sm truncate">
                              {repo.name}
                            </h3>
                            {repo.private && (
                              <Badge variant="secondary" className="text-xs">
                                Private
                              </Badge>
                            )}
                            {repo.fork && (
                              <Badge variant="outline" className="text-xs">
                                Fork
                              </Badge>
                            )}
                          </div>
                          
                          {repo.description && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {repo.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {repo.language && (
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                {repo.language}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              {repo.stargazers_count}
                            </div>
                            <div className="flex items-center gap-1">
                              <GitFork className="h-3 w-3" />
                              {repo.forks_count}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(repo.updated_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(repo.html_url, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => importRepository(repo)}
                            disabled={isImporting || (usageLimits ? !usageLimits.can_import : false)}
                          >
                            {isImporting && selectedRepo?.id === repo.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Download className="h-4 w-4 mr-2" />
                            )}
                            {usageLimits && !usageLimits.can_import ? 'Upgrade Required' : 'Import'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {filteredRepositories.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No repositories found matching your search.' : 'No repositories found.'}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
      <UpgradeDialog currentPlan={usageLimits?.plan_name} />
    </Card>
  )
}