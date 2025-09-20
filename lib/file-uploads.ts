import { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from './supabase-browser'

const browserSupabase = createSupabaseBrowserClient()

export interface FileUpload {
  id: string
  user_id: string
  project_id?: string
  filename: string
  file_path: string
  file_url: string
  file_size: number
  mime_type: string
  description?: string
  upload_status: 'pending' | 'uploading' | 'completed' | 'failed'
  created_at: string
  updated_at: string
}

export async function getUserFiles(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  userId: string,
  projectId?: string
): Promise<FileUpload[]> {
  if (!supabase || !userId) return []

  try {
    let query = supabase
      .from('file_uploads')
      .select('*')
      .eq('user_id', userId) // Uses idx_file_uploads_user_id index
      .order('created_at', { ascending: false })

    // If projectId is provided, use the project index
    if (projectId) {
      query = query.eq('project_id', projectId) // Uses idx_file_uploads_project_id index
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching user files:', error)
    return []
  }
}

export async function getProjectFiles(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  projectId: string
): Promise<FileUpload[]> {
  if (!supabase || !projectId) return []

  try {
    // Uses idx_file_uploads_project_id index
    const { data, error } = await supabase
      .from('file_uploads')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching project files:', error)
    return []
  }
}

export async function getFileById(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  fileId: string,
  userId: string
): Promise<FileUpload | null> {
  if (!supabase || !fileId || !userId) return null

  try {
    // Uses idx_file_uploads_user_id index for security
    const { data, error } = await supabase
      .from('file_uploads')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching file by ID:', error)
    return null
  }
}

export async function updateFileMetadata(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  fileId: string,
  userId: string,
  updates: Partial<FileUpload>
): Promise<boolean> {
  if (!supabase || !fileId || !userId) return false

  try {
    // Uses idx_file_uploads_user_id index for security
    const { error } = await supabase
      .from('file_uploads')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', fileId)
      .eq('user_id', userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error updating file metadata:', error)
    return false
  }
}

export async function deleteFile(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  fileId: string,
  userId: string
): Promise<boolean> {
  if (!supabase || !fileId || !userId) return false

  try {
    // Get file record first (uses idx_file_uploads_user_id index)
    const { data: fileRecord, error: fetchError } = await supabase
      .from('file_uploads')
      .select('file_path')
      .eq('id', fileId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !fileRecord) {
      console.error('File not found:', fetchError)
      return false
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('project-files')
      .remove([fileRecord.file_path])

    if (storageError) {
      console.error('Storage delete error:', storageError)
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('file_uploads')
      .delete()
      .eq('id', fileId)
      .eq('user_id', userId)

    if (dbError) throw dbError
    return true
  } catch (error) {
    console.error('Error deleting file:', error)
    return false
  }
}

export async function getFilesByMimeType(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  userId: string,
  mimeType: string,
  projectId?: string
): Promise<FileUpload[]> {
  if (!supabase || !userId || !mimeType) return []

  try {
    let query = supabase
      .from('file_uploads')
      .select('*')
      .eq('user_id', userId) // Uses idx_file_uploads_user_id index
      .eq('mime_type', mimeType)
      .order('created_at', { ascending: false })

    if (projectId) {
      query = query.eq('project_id', projectId) // Uses idx_file_uploads_project_id index
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching files by mime type:', error)
    return []
  }
}

export async function getRecentFiles(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  userId: string,
  limit: number = 10
): Promise<FileUpload[]> {
  if (!supabase || !userId) return []

  try {
    // Uses idx_file_uploads_user_id index
    const { data, error } = await supabase
      .from('file_uploads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching recent files:', error)
    return []
  }
}

export async function getFileStats(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  userId: string,
  projectId?: string
): Promise<{
  totalFiles: number
  totalSize: number
  fileTypes: { [key: string]: number }
}> {
  if (!supabase || !userId) {
    return { totalFiles: 0, totalSize: 0, fileTypes: {} }
  }

  try {
    let query = supabase
      .from('file_uploads')
      .select('file_size, mime_type')
      .eq('user_id', userId) // Uses idx_file_uploads_user_id index

    if (projectId) {
      query = query.eq('project_id', projectId) // Uses idx_file_uploads_project_id index
    }

    const { data, error } = await query

    if (error) throw error

    const files = data || []
    const totalFiles = files.length
    const totalSize = files.reduce((sum, file) => sum + (file.file_size || 0), 0)
    const fileTypes: { [key: string]: number } = {}

    files.forEach(file => {
      const type = file.mime_type || 'unknown'
      fileTypes[type] = (fileTypes[type] || 0) + 1
    })

    return { totalFiles, totalSize, fileTypes }
  } catch (error) {
    console.error('Error fetching file stats:', error)
    return { totalFiles: 0, totalSize: 0, fileTypes: {} }
  }
}

// =============================================
// STORAGE HELPER FUNCTIONS
// =============================================

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getFileTypeIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType.startsWith('video/')) return '🎥'
  if (mimeType.startsWith('audio/')) return '🎵'
  if (mimeType.includes('pdf')) return '📄'
  if (mimeType.includes('text/')) return '📝'
  if (mimeType.includes('json')) return '📋'
  if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦'
  return '📁'
}

export function isValidFileType(mimeType: string, allowedTypes?: string[]): boolean {
  if (!allowedTypes) return true
  return allowedTypes.some(type => mimeType.startsWith(type))
}