import { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from './supabase-client'

const browserSupabase = supabase

export interface ConversationThread {
  id: string
  title: string
  description?: string
  created_by: string
  project_id?: string
  is_public: boolean
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ThreadMessage {
  id: string
  thread_id: string
  sender_id: string
  content: string
  message_type: 'text' | 'code' | 'file' | 'image'
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ThreadSummary {
  id: string
  thread_id: string
  title: string
  description?: string
  participant_count: number
  message_count: number
  last_message_id?: string
  last_activity_at: string
  created_at: string
  updated_at: string
}

// =============================================
// CONVERSATION THREAD OPERATIONS (Uses indexed foreign keys)
// =============================================

export async function getUserConversationThreads(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  userId: string,
  projectId?: string
): Promise<ConversationThread[]> {
  if (!supabase || !userId) return []

  try {
    let query = supabase
      .from('conversation_threads')
      .select('*')
      .eq('created_by', userId) // Uses idx_conversation_threads_created_by index
      .order('updated_at', { ascending: false })

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching conversation threads:', error)
    return []
  }
}

export async function getPublicConversationThreads(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  limit: number = 20
): Promise<ConversationThread[]> {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('conversation_threads')
      .select('*')
      .eq('is_public', true)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching public conversation threads:', error)
    return []
  }
}

export async function createConversationThread(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  userId: string,
  title: string,
  description?: string,
  projectId?: string,
  isPublic: boolean = false
): Promise<ConversationThread | null> {
  if (!supabase || !userId || !title) return null

  try {
    // Uses idx_conversation_threads_created_by index
    const { data, error } = await supabase
      .from('conversation_threads')
      .insert({
        title,
        description,
        created_by: userId,
        project_id: projectId,
        is_public: isPublic,
        metadata: {}
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating conversation thread:', error)
    return null
  }
}

export async function updateConversationThread(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  threadId: string,
  userId: string,
  updates: Partial<ConversationThread>
): Promise<boolean> {
  if (!supabase || !threadId || !userId) return false

  try {
    // Uses idx_conversation_threads_created_by index for security
    const { error } = await supabase
      .from('conversation_threads')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', threadId)
      .eq('created_by', userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error updating conversation thread:', error)
    return false
  }
}

export async function deleteConversationThread(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  threadId: string,
  userId: string
): Promise<boolean> {
  if (!supabase || !threadId || !userId) return false

  try {
    // First delete all messages in the thread
    await supabase
      .from('thread_messages')
      .delete()
      .eq('thread_id', threadId)

    // Delete thread summaries
    await supabase
      .from('thread_summaries')
      .delete()
      .eq('thread_id', threadId)

    // Finally delete the thread (uses idx_conversation_threads_created_by index for security)
    const { error } = await supabase
      .from('conversation_threads')
      .delete()
      .eq('id', threadId)
      .eq('created_by', userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting conversation thread:', error)
    return false
  }
}

// =============================================
// THREAD MESSAGE OPERATIONS (Uses indexed foreign keys)
// =============================================

export async function getThreadMessages(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  threadId: string,
  limit: number = 50
): Promise<ThreadMessage[]> {
  if (!supabase || !threadId) return []

  try {
    // Uses idx_thread_messages_thread_id index
    const { data, error } = await supabase
      .from('thread_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching thread messages:', error)
    return []
  }
}

export async function getUserThreadMessages(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  userId: string,
  threadId?: string
): Promise<ThreadMessage[]> {
  if (!supabase || !userId) return []

  try {
    let query = supabase
      .from('thread_messages')
      .select('*')
      .eq('sender_id', userId) // Uses idx_thread_messages_sender_id index
      .order('created_at', { ascending: false })

    if (threadId) {
      query = query.eq('thread_id', threadId) // Uses idx_thread_messages_thread_id index
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching user thread messages:', error)
    return []
  }
}

export async function createThreadMessage(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  threadId: string,
  senderId: string,
  content: string,
  messageType: ThreadMessage['message_type'] = 'text',
  metadata?: Record<string, any>
): Promise<ThreadMessage | null> {
  if (!supabase || !threadId || !senderId || !content) return null

  try {
    // Uses idx_thread_messages_thread_id and idx_thread_messages_sender_id indexes
    const { data, error } = await supabase
      .from('thread_messages')
      .insert({
        thread_id: threadId,
        sender_id: senderId,
        content,
        message_type: messageType,
        metadata: metadata || {}
      })
      .select()
      .single()

    if (error) throw error

    // Update thread's last activity
    await supabase
      .from('conversation_threads')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', threadId)

    return data
  } catch (error) {
    console.error('Error creating thread message:', error)
    return null
  }
}

export async function updateThreadMessage(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  messageId: string,
  senderId: string,
  updates: Partial<ThreadMessage>
): Promise<boolean> {
  if (!supabase || !messageId || !senderId) return false

  try {
    // Uses idx_thread_messages_sender_id index for security
    const { error } = await supabase
      .from('thread_messages')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .eq('sender_id', senderId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error updating thread message:', error)
    return false
  }
}

export async function deleteThreadMessage(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  messageId: string,
  senderId: string
): Promise<boolean> {
  if (!supabase || !messageId || !senderId) return false

  try {
    // Uses idx_thread_messages_sender_id index for security
    const { error } = await supabase
      .from('thread_messages')
      .delete()
      .eq('id', messageId)
      .eq('sender_id', senderId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting thread message:', error)
    return false
  }
}

// =============================================
// THREAD SUMMARY OPERATIONS (Uses indexed foreign keys)
// =============================================

export async function getThreadSummary(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  threadId: string
): Promise<ThreadSummary | null> {
  if (!supabase || !threadId) return null

  try {
    // Uses idx_thread_summaries_thread_id index
    const { data, error } = await supabase
      .from('thread_summaries')
      .select('*')
      .eq('thread_id', threadId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching thread summary:', error)
    return null
  }
}

export async function updateThreadSummary(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  threadId: string
): Promise<boolean> {
  if (!supabase || !threadId) return false

  try {
    // Get thread info
    const { data: thread, error: threadError } = await supabase
      .from('conversation_threads')
      .select('title, description')
      .eq('id', threadId)
      .single()

    if (threadError || !thread) return false

    // Get message count
    const { count: messageCount, error: countError } = await supabase
      .from('thread_messages')
      .select('id', { count: 'exact' })
      .eq('thread_id', threadId)

    if (countError) return false

    // Get last message (uses idx_thread_messages_thread_id index)
    const { data: lastMessage, error: lastMessageError } = await supabase
      .from('thread_messages')
      .select('id, created_at')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Update or create summary (uses idx_thread_summaries_thread_id index)
    const { error: upsertError } = await supabase
      .from('thread_summaries')
      .upsert({
        thread_id: threadId,
        title: thread.title,
        description: thread.description,
        participant_count: 1, // TODO: Calculate actual participant count
        message_count: messageCount || 0,
        last_message_id: lastMessage?.id,
        last_activity_at: lastMessage?.created_at || new Date().toISOString()
      })

    if (upsertError) throw upsertError
    return true
  } catch (error) {
    console.error('Error updating thread summary:', error)
    return false
  }
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

export function getMessageTypeIcon(messageType: ThreadMessage['message_type']): string {
  const icons = {
    text: '💬',
    code: '💻',
    file: '📎',
    image: '🖼️'
  }
  return icons[messageType] || '💬'
}

export function formatMessagePreview(content: string, maxLength: number = 100): string {
  if (content.length <= maxLength) return content
  return content.substring(0, maxLength) + '...'
}

export function getThreadActivityStatus(lastActivityAt: string): string {
  const now = new Date()
  const lastActivity = new Date(lastActivityAt)
  const diffMs = now.getTime() - lastActivity.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  const diffDays = diffHours / 24

  if (diffHours < 1) return 'Active now'
  if (diffHours < 24) return `${Math.floor(diffHours)} hours ago`
  if (diffDays < 7) return `${Math.floor(diffDays)} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return `${Math.floor(diffDays / 30)} months ago`
}
