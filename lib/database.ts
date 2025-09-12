import { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from './supabase-browser'
import { Message } from './messages'
import { getFromCache, setInCache, invalidateCache } from './caching'

// The supabase client will be passed as an argument to functions.
// A browser client is created here for convenience on the client-side.
const browserSupabase = createSupabaseBrowserClient()

export interface Project {
  id: string
  user_id: string
  team_id?: string
  title: string
  description?: string
  template_id?: string
  status: 'active' | 'archived' | 'deleted'
  is_public: boolean
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface DbMessage {
  id: string
  project_id: string
  role: 'user' | 'assistant'
  content: Message['content']
  object_data?: any
  result_data?: any
  sequence_number: number
  created_at: string
}

// Global flag to prevent excessive retries
let tablesChecked = false
let tablesExist = false

// Check if tables exist once, then cache result
async function ensureTablesExist(supabase: SupabaseClient<any, "public", any>): Promise<boolean> {
  if (tablesChecked) return tablesExist;

  if (!supabase) {
    tablesChecked = true
    tablesExist = false
    return false
  }

  try {
    // Quick check for critical tables
    const { error } = await supabase.from('projects').select('id').limit(1)

    tablesChecked = true
    tablesExist = !error || error.code !== 'PGRST106'
    
    if (!tablesExist) {
      console.warn('Database tables do not exist. Please run the migration.')
    }
    
    return tablesExist
  } catch (error) {
    console.error('Table check failed:', error)
    tablesChecked = true
    tablesExist = false
    return false
  }
}

// Wrapper to prevent API calls when tables don't exist
async function safeApiCall<T>(
  supabase: SupabaseClient<any, "public", any>,
  operation: () => Promise<T>,
  fallback: T,
  operationName: string
): Promise<T> {
  if (!(await ensureTablesExist(supabase))) {
    console.warn(`Skipping ${operationName} - tables do not exist`)
    return fallback
  }
  
  try {
    return await operation()
  } catch (error) {
    console.error(`${operationName} failed:`, error)
    return fallback
  }
}

// =============================================
// PROJECT OPERATIONS
// =============================================

export async function createProject(
  supabase: SupabaseClient<any, "public", any>,
  title: string, 
  templateId?: string,
  description?: string,
  teamId?: string
): Promise<Project | null> {
  return safeApiCall(supabase, async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        team_id: teamId,
        title,
        description,
        template_id: templateId,
        status: 'active',
        is_public: false,
        metadata: {}
      })
      .select()
      .single()

    if (error) throw error
    return data
  }, null, 'createProject')
}

export async function getProjects(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  includeArchived: boolean = false,
  teamId?: string
): Promise<Project[]> {
  const { data: { user } } = await supabase!.auth.getUser()
  if (!user) return []

  const cacheKey = `projects:${user.id}:${includeArchived}:${teamId || ''}`
  const cachedProjects = getFromCache<Project[]>(cacheKey)
  if (cachedProjects) {
    return cachedProjects
  }

  return safeApiCall(supabase!, async () => {
    let query = supabase!
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })

    if (!includeArchived) {
      query = query.eq('status', 'active')
    }

    if (teamId) {
      query = query.eq('team_id', teamId)
    }

    const { data, error } = await query
    if (error) throw error
    
    setInCache(cacheKey, data || [])
    return data || []
  }, [], 'getProjects')
}

export async function getProject(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  projectId: string
): Promise<Project | null> {
  return safeApiCall(supabase!, async () => {
    const { data, error } = await supabase!
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (error) throw error
    return data
  }, null, 'getProject')
}

export async function updateProject(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  id: string, 
  updates: Partial<Project>
): Promise<boolean> {
  const { data: { user } } = await supabase!.auth.getUser()
  if (user) {
    invalidateCache(new RegExp(`^projects:${user.id}:`))
  }

  return safeApiCall(supabase!, async () => {
    const { error } = await supabase!
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    return true
  }, false, 'updateProject')
}

export async function deleteProject(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  id: string, 
  permanent: boolean = false
): Promise<boolean> {
  const { data: { user } } = await supabase!.auth.getUser()
  if (user) {
    invalidateCache(new RegExp(`^projects:${user.id}:`))
  }

  return safeApiCall(supabase!, async () => {
    if (permanent) {
      const { error } = await supabase!
        .from('projects')
        .delete()
        .eq('id', id)
      if (error) throw error
    } else {
      const { error } = await supabase!
        .from('projects')
        .update({ 
          deleted_at: new Date().toISOString(),
          status: 'deleted'
        })
        .eq('id', id)
      if (error) throw error
    }
    return true
  }, false, 'deleteProject')
}

// =============================================
// MESSAGE OPERATIONS
// =============================================

export async function saveMessage(
  supabase: SupabaseClient<any, 'public', any> | null = browserSupabase,
  projectId: string,
  message: Message,
  sequenceNumber: number,
): Promise<boolean> {
  return safeApiCall(
    supabase!,
    async () => {
      const { error } = await supabase!.rpc('save_message_and_update_project', {
        project_id_param: projectId,
        role_param: message.role,
        content_param: message.content,
        object_data_param: message.object,
        result_data_param: message.result,
        sequence_number_param: sequenceNumber,
      })

      if (error) throw error
      return true
    },
    false,
    'saveMessage',
  )
}

export async function getProjectMessages(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  projectId: string
): Promise<Message[]> {
  const cacheKey = `project-messages:${projectId}`
  const cachedMessages = getFromCache<Message[]>(cacheKey)
  if (cachedMessages) {
    return cachedMessages
  }

  return safeApiCall(supabase!, async () => {
    const { data, error } = await supabase!
      .from('messages')
      .select('*')
      .eq('project_id', projectId)
      .order('sequence_number', { ascending: true })

    if (error) throw error

    const messages = data?.map((msg: DbMessage) => ({
      role: msg.role,
      content: msg.content,
      object: msg.object_data,
      result: msg.result_data,
    })) || []

    setInCache(cacheKey, messages)
    return messages
  }, [], 'getProjectMessages')
}

export async function clearProjectMessages(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  projectId: string
): Promise<boolean> {
  invalidateCache(`project-messages:${projectId}`)
  return safeApiCall(supabase!, async () => {
    const { error } = await supabase!
      .from('messages')
      .delete()
      .eq('project_id', projectId)

    if (error) throw error
    return true
  }, false, 'clearProjectMessages')
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

export async function generateProjectTitle(firstMessage: string): Promise<string> {
  const words = firstMessage.trim().split(' ').slice(0, 6)
  let title = words.join(' ')
  
  if (firstMessage.split(' ').length > 6) {
    title += '...'
  }
  
  if (!title.trim()) {
    title = 'New Project'
  }
  
  return title
}

// Reset the tables check (useful for when migration is completed)
export function resetTableCheck(): void {
  tablesChecked = false
  tablesExist = false
}
