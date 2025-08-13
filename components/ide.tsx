'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileTree, FileSystemNode } from '@/components/file-tree'
import { CodeView } from '@/components/code-view'
import { GitHubImport } from '@/components/github-import'
import { useAuth } from '@/lib/auth'
import { Button } from './ui/button'
import { Github, FolderOpen } from 'lucide-react'
import Spinner from './ui/spinner'
import { API_BASE_URL } from '@/lib/config'

export function IDE() {
  const { session, loading } = useAuth(() => {}, () => {})
  const [files, setFiles] = useState<FileSystemNode[]>([])
  const [selectedFile, setSelectedFile] = useState<{
    path: string
    content: string
  } | null>(null)
  const [showGitHubImport, setShowGitHubImport] = useState(false)

  const fetchFiles = useCallback(async () => {
    if (!session) return
    try {
      const response = await fetch(`${API_BASE_URL}/api/files?sessionID=${session.user.id}`)
      if (response.ok) {
        const data = await response.json()
        setFiles(data)
      } else {
        console.error('Failed to fetch files')
        setFiles([])
      }
    } catch (error) {
      console.error('Error fetching files:', error)
      setFiles([])
    }
  }, [session])

  useEffect(() => {
    if (session) {
      fetchFiles()
    }
  }, [session, fetchFiles])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    )
  }

  async function handleSelectFile(path: string) {
    if (!session) return
    const response = await fetch(`${API_BASE_URL}/api/files/content?sessionID=${session.user.id}&path=${path}`)
    const { content } = await response.json()
    setSelectedFile({ path, content })
  }

  async function handleSaveFile(path: string, content: string) {
    if (!session) return
    await fetch(`${API_BASE_URL}/api/files/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionID: session.user.id, path, content }),
    })
  }

  async function handleCreateFile(path: string, isDirectory: boolean) {
    if (!session) return
    try {
      const response = await fetch(`${API_BASE_URL}/api/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionID: session.user.id,
          path,
          isDirectory,
          content: isDirectory ? '' : '// New file\n'
        }),
      })
      if (response.ok) {
        await fetchFiles()
      }
    } catch (error) {
      console.error('Error creating file:', error)
    }
  }

  async function handleDeleteFile(path: string) {
    if (!session) return
    try {
      const response = await fetch(`${API_BASE_URL}/api/files`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionID: session.user.id,
          path,
        }),
      })
      if (response.ok) {
        await fetchFiles()
        if (selectedFile?.path === path) {
          setSelectedFile(null)
        }
      }
    } catch (error) {
      console.error('Error deleting file:', error)
    }
  }

  async function handleImportRepository(repo: any, repoFiles: any[]) {
    if (!session) return
    try {
      // Import each file from the repository
      for (const file of repoFiles) {
        await fetch(`${API_BASE_URL}/api/files/content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionID: session.user.id,
            path: `/${repo.name}/${file.path}`,
            content: file.content,
          }),
        })
      }
      
      // Refresh the file tree
      await fetchFiles()
      setShowGitHubImport(false)
    } catch (error) {
      console.error('Error importing repository:', error)
    }
  }

  if (showGitHubImport) {
    return (
      <div className="h-full p-4 overflow-auto">
        <GitHubImport
          onImport={handleImportRepository}
          onClose={() => setShowGitHubImport(false)}
        />
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <div className="w-1/4 border-r overflow-auto">
        <div className="p-2 border-b space-y-2">
          <Button
            onClick={fetchFiles}
            className="w-full"
            variant="outline"
            size="sm"
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            Refresh Files
          </Button>
          <Button
            onClick={() => setShowGitHubImport(true)}
            className="w-full"
            variant="outline"
            size="sm"
          >
            <Github className="h-4 w-4 mr-2" />
            Import from GitHub
          </Button>
        </div>
        <FileTree 
          files={files} 
          onSelectFile={handleSelectFile}
          onCreateFile={handleCreateFile}
          onDeleteFile={handleDeleteFile}
        />
      </div>
      <div className="w-3/4">
        {selectedFile ? (
          <CodeView
            key={selectedFile.path}
            code={selectedFile.content}
            lang="typescript" // TODO: Detect language from file extension
            onSave={(content) => handleSaveFile(selectedFile.path, content)}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p>Select a file to view its content</p>
          </div>
        )}
      </div>
    </div>
  )
}
