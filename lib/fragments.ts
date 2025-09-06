import { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from './supabase-client'

const browserSupabase = supabase

export interface Fragment {
  id: string
  user_id: string
  project_id?: string
  title: string
  description?: string
  code: string
  language: string
  template_id?: string
  is_public: boolean
  tags?: string[]
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface FragmentExecution {
  id: string
  fragment_id: string
  user_id: string
  execution_status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  sandbox_id?: string
  input_data?: Record<string, any>
  output_data?: Record<string, any>
  error_message?: string
  execution_time_ms?: number
  created_at: string
  updated_at: string
}

// =============================================
// FRAGMENT OPERATIONS (Uses indexed foreign keys)
// =============================================

export async function getUserFragments(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  userId: string,
  projectId?: string
): Promise<Fragment[]> {
  if (!supabase || !userId) return []

  try {
    let query = supabase
      .from('fragments')
      .select('*')
      .eq('user_id', userId) // Uses idx_fragments_user_id index
      .order('updated_at', { ascending: false })

    if (projectId) {
      query = query.eq('project_id', projectId) // Uses idx_fragments_project_id index
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching user fragments:', error)
    return []
  }
}

export async function getProjectFragments(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  projectId: string
): Promise<Fragment[]> {
  if (!supabase || !projectId) return []

  try {
    // Uses idx_fragments_project_id index
    const { data, error } = await supabase
      .from('fragments')
      .select('*')
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching project fragments:', error)
    return []
  }
}

export async function getFragmentById(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  fragmentId: string,
  userId: string
): Promise<Fragment | null> {
  if (!supabase || !fragmentId || !userId) return null

  try {
    // Uses idx_fragments_user_id index for security
    const { data, error } = await supabase
      .from('fragments')
      .select('*')
      .eq('id', fragmentId)
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching fragment by ID:', error)
    return null
  }
}

export async function createFragment(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  userId: string,
  fragment: Omit<Fragment, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<Fragment | null> {
  if (!supabase || !userId) return null

  try {
    // Uses idx_fragments_user_id and idx_fragments_project_id indexes
    const { data, error } = await supabase
      .from('fragments')
      .insert({
        user_id: userId,
        ...fragment
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating fragment:', error)
    return null
  }
}

export async function updateFragment(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  fragmentId: string,
  userId: string,
  updates: Partial<Fragment>
): Promise<boolean> {
  if (!supabase || !fragmentId || !userId) return false

  try {
    // Uses idx_fragments_user_id index for security
    const { error } = await supabase
      .from('fragments')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', fragmentId)
      .eq('user_id', userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error updating fragment:', error)
    return false
  }
}

export async function deleteFragment(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  fragmentId: string,
  userId: string
): Promise<boolean> {
  if (!supabase || !fragmentId || !userId) return false

  try {
    // First delete all executions for this fragment
    await supabase
      .from('fragment_executions')
      .delete()
      .eq('fragment_id', fragmentId)
      .eq('user_id', userId)

    // Then delete the fragment (uses idx_fragments_user_id index for security)
    const { error } = await supabase
      .from('fragments')
      .delete()
      .eq('id', fragmentId)
      .eq('user_id', userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting fragment:', error)
    return false
  }
}

export async function getFragmentsByLanguage(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  userId: string,
  language: string
): Promise<Fragment[]> {
  if (!supabase || !userId || !language) return []

  try {
    // Uses idx_fragments_user_id index
    const { data, error } = await supabase
      .from('fragments')
      .select('*')
      .eq('user_id', userId)
      .eq('language', language)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching fragments by language:', error)
    return []
  }
}

export async function getPublicFragments(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  limit: number = 20
): Promise<Fragment[]> {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('fragments')
      .select('*')
      .eq('is_public', true)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching public fragments:', error)
    return []
  }
}

// =============================================
// FRAGMENT EXECUTION OPERATIONS (Uses indexed foreign keys)
// =============================================

export async function getFragmentExecutions(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  fragmentId: string,
  userId: string
): Promise<FragmentExecution[]> {
  if (!supabase || !fragmentId || !userId) return []

  try {
    // Uses idx_fragment_executions_fragment_id and idx_fragment_executions_user_id indexes
    const { data, error } = await supabase
      .from('fragment_executions')
      .select('*')
      .eq('fragment_id', fragmentId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching fragment executions:', error)
    return []
  }
}

export async function getUserExecutions(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  userId: string,
  limit: number = 50
): Promise<FragmentExecution[]> {
  if (!supabase || !userId) return []

  try {
    // Uses idx_fragment_executions_user_id index
    const { data, error } = await supabase
      .from('fragment_executions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching user executions:', error)
    return []
  }
}

export async function createFragmentExecution(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  fragmentId: string,
  userId: string,
  inputData?: Record<string, any>
): Promise<FragmentExecution | null> {
  if (!supabase || !fragmentId || !userId) return null

  try {
    // Uses idx_fragment_executions_fragment_id and idx_fragment_executions_user_id indexes
    const { data, error } = await supabase
      .from('fragment_executions')
      .insert({
        fragment_id: fragmentId,
        user_id: userId,
        execution_status: 'pending',
        input_data: inputData
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating fragment execution:', error)
    return null
  }
}

export async function updateFragmentExecution(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  executionId: string,
  userId: string,
  updates: Partial<FragmentExecution>
): Promise<boolean> {
  if (!supabase || !executionId || !userId) return false

  try {
    // Uses idx_fragment_executions_user_id index for security
    const { error } = await supabase
      .from('fragment_executions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', executionId)
      .eq('user_id', userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error updating fragment execution:', error)
    return false
  }
}

export async function getExecutionById(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  executionId: string,
  userId: string
): Promise<FragmentExecution | null> {
  if (!supabase || !executionId || !userId) return null

  try {
    // Uses idx_fragment_executions_user_id index for security
    const { data, error } = await supabase
      .from('fragment_executions')
      .select('*')
      .eq('id', executionId)
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching execution by ID:', error)
    return null
  }
}

export async function getExecutionStats(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  userId: string,
  fragmentId?: string
): Promise<{
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  averageExecutionTime: number
}> {
  if (!supabase || !userId) {
    return { totalExecutions: 0, successfulExecutions: 0, failedExecutions: 0, averageExecutionTime: 0 }
  }

  try {
    let query = supabase
      .from('fragment_executions')
      .select('execution_status, execution_time_ms')
      .eq('user_id', userId) // Uses idx_fragment_executions_user_id index

    if (fragmentId) {
      query = query.eq('fragment_id', fragmentId) // Uses idx_fragment_executions_fragment_id index
    }

    const { data, error } = await query

    if (error) throw error

    const executions = data || []
    const totalExecutions = executions.length
    const successfulExecutions = executions.filter(e => e.execution_status === 'completed').length
    const failedExecutions = executions.filter(e => e.execution_status === 'failed').length
    
    const executionTimes = executions
      .filter(e => e.execution_time_ms && e.execution_status === 'completed')
      .map(e => e.execution_time_ms!)
    
    const averageExecutionTime = executionTimes.length > 0 
      ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length 
      : 0

    return { totalExecutions, successfulExecutions, failedExecutions, averageExecutionTime }
  } catch (error) {
    console.error('Error fetching execution stats:', error)
    return { totalExecutions: 0, successfulExecutions: 0, failedExecutions: 0, averageExecutionTime: 0 }
  }
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

export function getLanguageIcon(language: string): string {
  const icons: { [key: string]: string } = {
    javascript: '🟨',
    typescript: '🔷',
    python: '🐍',
    java: '☕',
    cpp: '⚡',
    csharp: '🔷',
    go: '🐹',
    rust: '🦀',
    php: '🐘',
    ruby: '💎',
    swift: '🍎',
    kotlin: '🟪',
    scala: '🔴',
    r: '📊',
    sql: '🗃️',
    shell: '🐚',
    html: '🌐',
    css: '🎨'
  }
  return icons[language.toLowerCase()] || '📄'
}

export function formatExecutionTime(timeMs: number): string {
  if (timeMs < 1000) return `${timeMs}ms`
  if (timeMs < 60000) return `${(timeMs / 1000).toFixed(1)}s`
  return `${(timeMs / 60000).toFixed(1)}m`
}

export function getExecutionStatusIcon(status: FragmentExecution['execution_status']): string {
  const icons = {
    pending: '⏳',
    running: '🏃‍♂️',
    completed: '✅',
    failed: '❌',
    cancelled: '🚫'
  }
  return icons[status] || '❓'
}

export function getExecutionStatusColor(status: FragmentExecution['execution_status']): string {
  const colors = {
    pending: 'text-yellow-500',
    running: 'text-blue-500',
    completed: 'text-green-500',
    failed: 'text-red-500',
    cancelled: 'text-gray-500'
  }
  return colors[status] || 'text-gray-500'
}
