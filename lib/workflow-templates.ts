import { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from './supabase-client'

const browserSupabase = supabase

export interface WorkflowTemplate {
  id: string
  name: string
  description?: string
  category: string
  created_by: string
  workflow_definition: Record<string, any>
  input_schema?: Record<string, any>
  output_schema?: Record<string, any>
  is_public: boolean
  tags?: string[]
  version: string
  created_at: string
  updated_at: string
}

export interface WorkflowExecution {
  id: string
  template_id: string
  name?: string
  created_by: string
  execution_status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  input_data?: Record<string, any>
  output_data?: Record<string, any>
  error_message?: string
  execution_steps?: Array<{
    step_name: string
    status: string
    result?: any
    error?: string
    timestamp: string
  }>
  started_at?: string
  completed_at?: string
  execution_time_ms?: number
  created_at: string
  updated_at: string
}

// =============================================
// WORKFLOW TEMPLATE OPERATIONS (Uses indexed foreign keys)
// =============================================

export async function getUserWorkflowTemplates(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  userId: string,
  category?: string
): Promise<WorkflowTemplate[]> {
  if (!supabase || !userId) return []

  try {
    let query = supabase
      .from('workflow_templates')
      .select('*')
      .eq('created_by', userId) // Uses idx_workflow_templates_created_by index
      .order('updated_at', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching workflow templates:', error)
    return []
  }
}

export async function getPublicWorkflowTemplates(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  category?: string,
  limit: number = 20
): Promise<WorkflowTemplate[]> {
  if (!supabase) return []

  try {
    let query = supabase
      .from('workflow_templates')
      .select('*')
      .eq('is_public', true)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching public workflow templates:', error)
    return []
  }
}

export async function createWorkflowTemplate(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  userId: string,
  template: Omit<WorkflowTemplate, 'id' | 'created_by' | 'created_at' | 'updated_at'>
): Promise<WorkflowTemplate | null> {
  if (!supabase || !userId) return null

  try {
    // Uses idx_workflow_templates_created_by index
    const { data, error } = await supabase
      .from('workflow_templates')
      .insert({
        ...template,
        created_by: userId
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating workflow template:', error)
    return null
  }
}

export async function updateWorkflowTemplate(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  templateId: string,
  userId: string,
  updates: Partial<WorkflowTemplate>
): Promise<boolean> {
  if (!supabase || !templateId || !userId) return false

  try {
    // Uses idx_workflow_templates_created_by index for security
    const { error } = await supabase
      .from('workflow_templates')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId)
      .eq('created_by', userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error updating workflow template:', error)
    return false
  }
}

export async function deleteWorkflowTemplate(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  templateId: string,
  userId: string
): Promise<boolean> {
  if (!supabase || !templateId || !userId) return false

  try {
    // First delete all executions for this template
    await supabase
      .from('workflow_executions')
      .delete()
      .eq('template_id', templateId)
      .eq('created_by', userId)

    // Then delete the template (uses idx_workflow_templates_created_by index for security)
    const { error } = await supabase
      .from('workflow_templates')
      .delete()
      .eq('id', templateId)
      .eq('created_by', userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting workflow template:', error)
    return false
  }
}

export async function getWorkflowTemplateById(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  templateId: string,
  userId?: string
): Promise<WorkflowTemplate | null> {
  if (!supabase || !templateId) return null

  try {
    let query = supabase
      .from('workflow_templates')
      .select('*')
      .eq('id', templateId)

    // If userId is provided, also check if it's the creator or if it's public
    if (userId) {
      query = query.or(`created_by.eq.${userId},is_public.eq.true`)
    } else {
      query = query.eq('is_public', true)
    }

    const { data, error } = await query.single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching workflow template by ID:', error)
    return null
  }
}

// =============================================
// WORKFLOW EXECUTION OPERATIONS (Uses indexed foreign keys)
// =============================================

export async function getUserWorkflowExecutions(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  userId: string,
  templateId?: string,
  limit: number = 50
): Promise<WorkflowExecution[]> {
  if (!supabase || !userId) return []

  try {
    let query = supabase
      .from('workflow_executions')
      .select('*')
      .eq('created_by', userId) // Uses idx_workflow_executions_created_by index
      .order('created_at', { ascending: false })
      .limit(limit)

    if (templateId) {
      query = query.eq('template_id', templateId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching workflow executions:', error)
    return []
  }
}

export async function createWorkflowExecution(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  templateId: string,
  userId: string,
  name?: string,
  inputData?: Record<string, any>
): Promise<WorkflowExecution | null> {
  if (!supabase || !templateId || !userId) return null

  try {
    // Uses idx_workflow_executions_created_by index
    const { data, error } = await supabase
      .from('workflow_executions')
      .insert({
        template_id: templateId,
        name,
        created_by: userId,
        execution_status: 'pending',
        input_data: inputData,
        execution_steps: []
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating workflow execution:', error)
    return null
  }
}

export async function updateWorkflowExecution(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  executionId: string,
  userId: string,
  updates: Partial<WorkflowExecution>
): Promise<boolean> {
  if (!supabase || !executionId || !userId) return false

  try {
    // Uses idx_workflow_executions_created_by index for security
    const { error } = await supabase
      .from('workflow_executions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', executionId)
      .eq('created_by', userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error updating workflow execution:', error)
    return false
  }
}

export async function getWorkflowExecutionById(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  executionId: string,
  userId: string
): Promise<WorkflowExecution | null> {
  if (!supabase || !executionId || !userId) return null

  try {
    // Uses idx_workflow_executions_created_by index for security
    const { data, error } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('id', executionId)
      .eq('created_by', userId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching workflow execution by ID:', error)
    return null
  }
}

export async function getWorkflowExecutionStats(
  supabase: SupabaseClient<any, "public", any> | null = browserSupabase,
  userId: string,
  templateId?: string
): Promise<{
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  runningExecutions: number
  averageExecutionTime: number
}> {
  if (!supabase || !userId) {
    return { 
      totalExecutions: 0, 
      successfulExecutions: 0, 
      failedExecutions: 0, 
      runningExecutions: 0,
      averageExecutionTime: 0 
    }
  }

  try {
    let query = supabase
      .from('workflow_executions')
      .select('execution_status, execution_time_ms')
      .eq('created_by', userId) // Uses idx_workflow_executions_created_by index

    if (templateId) {
      query = query.eq('template_id', templateId)
    }

    const { data, error } = await query

    if (error) throw error

    const executions = data || []
    const totalExecutions = executions.length
    const successfulExecutions = executions.filter(e => e.execution_status === 'completed').length
    const failedExecutions = executions.filter(e => e.execution_status === 'failed').length
    const runningExecutions = executions.filter(e => 
      e.execution_status === 'running' || e.execution_status === 'pending'
    ).length
    
    const executionTimes = executions
      .filter(e => e.execution_time_ms && e.execution_status === 'completed')
      .map(e => e.execution_time_ms!)
    
    const averageExecutionTime = executionTimes.length > 0 
      ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length 
      : 0

    return { 
      totalExecutions, 
      successfulExecutions, 
      failedExecutions, 
      runningExecutions,
      averageExecutionTime 
    }
  } catch (error) {
    console.error('Error fetching workflow execution stats:', error)
    return { 
      totalExecutions: 0, 
      successfulExecutions: 0, 
      failedExecutions: 0, 
      runningExecutions: 0,
      averageExecutionTime: 0 
    }
  }
}

// =============================================
// WORKFLOW CATEGORIES AND UTILITIES
// =============================================

export const WORKFLOW_CATEGORIES = [
  'data-processing',
  'web-scraping',
  'api-integration',
  'file-processing',
  'automation',
  'ai-ml',
  'testing',
  'deployment',
  'monitoring',
  'other'
] as const

export type WorkflowCategory = typeof WORKFLOW_CATEGORIES[number]

export function getCategoryIcon(category: string): string {
  const icons: { [key: string]: string } = {
    'data-processing': '📊',
    'web-scraping': '🕷️',
    'api-integration': '🔗',
    'file-processing': '📁',
    'automation': '🤖',
    'ai-ml': '🧠',
    'testing': '🧪',
    'deployment': '🚀',
    'monitoring': '📈',
    'other': '⚙️'
  }
  return icons[category] || '⚙️'
}

export function getExecutionStatusIcon(status: WorkflowExecution['execution_status']): string {
  const icons = {
    pending: '⏳',
    running: '🏃‍♂️',
    completed: '✅',
    failed: '❌',
    cancelled: '🚫'
  }
  return icons[status] || '❓'
}

export function getExecutionStatusColor(status: WorkflowExecution['execution_status']): string {
  const colors = {
    pending: 'text-yellow-500',
    running: 'text-blue-500',
    completed: 'text-green-500',
    failed: 'text-red-500',
    cancelled: 'text-gray-500'
  }
  return colors[status] || 'text-gray-500'
}

export function formatExecutionTime(timeMs: number): string {
  if (timeMs < 1000) return `${timeMs}ms`
  if (timeMs < 60000) return `${(timeMs / 1000).toFixed(1)}s`
  if (timeMs < 3600000) return `${(timeMs / 60000).toFixed(1)}m`
  return `${(timeMs / 3600000).toFixed(1)}h`
}

export function validateWorkflowDefinition(definition: Record<string, any>): boolean {
  // Basic validation for workflow definition structure
  if (!definition || typeof definition !== 'object') return false
  if (!definition.steps || !Array.isArray(definition.steps)) return false
  if (definition.steps.length === 0) return false
  
  // Each step should have a name and type
  return definition.steps.every((step: any) => 
    step.name && typeof step.name === 'string' &&
    step.type && typeof step.type === 'string'
  )
}
