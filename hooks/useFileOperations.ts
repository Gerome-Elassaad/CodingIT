import { useState, useCallback } from 'react'
import useAsyncState from './useAsyncState'
import { API_BASE_URL } from '@/lib/config'

export interface FileNode {
  name: string
  path: string
  isDirectory: boolean
  children?: FileNode[]
  size?: number
  lastModified?: string
}

export interface FileOperationsState {
  fileTree: FileNode[]
  currentFile: string | null
  fileContent: string
  unsavedChanges: boolean
}

export interface FileOperationsHook extends FileOperationsState {
  // File tree operations
  loadFileTree: (sessionId: string, template: string) => Promise<FileNode[]>
  refreshFileTree: () => Promise<void>
  
  // File content operations
  loadFile: (sessionId: string, path: string) => Promise<string>
  saveFile: (sessionId: string, path: string, content: string) => Promise<void>
  createFile: (sessionId: string, path: string, content?: string) => Promise<void>
  deleteFile: (sessionId: string, path: string) => Promise<void>
  
  // State management
  setCurrentFile: (path: string | null) => void
  setFileContent: (content: string) => void
  markSaved: () => void
  
  // Loading states
  loading: boolean
  error: Error | null
}

function useFileOperations(sessionId?: string, template?: string): FileOperationsHook {
  const [state, setState] = useState<FileOperationsState>({
    fileTree: [],
    currentFile: null,
    fileContent: '',
    unsavedChanges: false,
  })

  const {
    loading,
    error,
    execute: executeAsync,
    reset: resetAsync
  } = useAsyncState()

  const loadFileTree = useCallback(async (sessionId: string, template: string): Promise<FileNode[]> => {
    const response = await fetch(`${API_BASE_URL}/api/files?sessionID=${sessionId}&template=${template}`)
    
    if (!response.ok) {
      throw new Error(`Failed to load file tree: ${response.statusText}`)
    }
    
    const data = await response.json()
    const fileTree = Array.isArray(data.data) ? data.data : data
    
    setState(prev => ({ ...prev, fileTree }))
    return fileTree
  }, [])

  const refreshFileTree = useCallback(async () => {
    if (!sessionId || !template) return
    return executeAsync(() => loadFileTree(sessionId, template))
  }, [sessionId, template, loadFileTree, executeAsync])

  const loadFile = useCallback(async (sessionId: string, path: string): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/api/files/content?sessionID=${sessionId}&path=${encodeURIComponent(path)}`)
    
    if (!response.ok) {
      throw new Error(`Failed to load file: ${response.statusText}`)
    }
    
    const data = await response.json()
    const content = data.data?.content || data.content || ''
    
    setState(prev => ({
      ...prev,
      currentFile: path,
      fileContent: content,
      unsavedChanges: false
    }))
    
    return content
  }, [])

  const saveFile = useCallback(async (sessionId: string, path: string, content: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/files/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionID: sessionId,
        path,
        content,
        template
      }),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to save file: ${response.statusText}`)
    }
    
    setState(prev => ({ ...prev, unsavedChanges: false }))
  }, [template])

  const createFile = useCallback(async (sessionId: string, path: string, content: string = ''): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/files/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionID: sessionId,
        path,
        content,
        template
      }),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to create file: ${response.statusText}`)
    }
    
    // Refresh file tree to show the new file
    await refreshFileTree()
  }, [template, refreshFileTree])

  const deleteFile = useCallback(async (sessionId: string, path: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/files/content`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionID: sessionId,
        path,
        template
      }),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to delete file: ${response.statusText}`)
    }
    
    // If the deleted file was the current file, clear it
    setState(prev => ({
      ...prev,
      currentFile: prev.currentFile === path ? null : prev.currentFile,
      fileContent: prev.currentFile === path ? '' : prev.fileContent,
      unsavedChanges: false
    }))
    
    // Refresh file tree to remove the file
    await refreshFileTree()
  }, [template, refreshFileTree])

  const setCurrentFile = useCallback((path: string | null) => {
    setState(prev => ({ ...prev, currentFile: path }))
  }, [])

  const setFileContent = useCallback((content: string) => {
    setState(prev => ({
      ...prev,
      fileContent: content,
      unsavedChanges: prev.fileContent !== content
    }))
  }, [])

  const markSaved = useCallback(() => {
    setState(prev => ({ ...prev, unsavedChanges: false }))
  }, [])

  return {
    ...state,
    loadFileTree,
    refreshFileTree,
    loadFile,
    saveFile,
    createFile,
    deleteFile,
    setCurrentFile,
    setFileContent,
    markSaved,
    loading,
    error,
  }
}

export default useFileOperations