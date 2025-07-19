import { createClient } from '@supabase/supabase-js'
import { WorkflowSchema, WorkflowExecution, FragmentNode, Connection } from './workflow-engine'

export interface Database {
  public: {
    Tables: {
      workflows: {
        Row: {
          id: string
          team_id: string | null
          name: string
          description: string | null
          schema: any // JSONB
          is_active: boolean
          created_at: string
          updated_at: string
          version: number
        }
        Insert: {
          id?: string
          team_id?: string | null
          name: string
          description?: string | null
          schema: any
          is_active?: boolean
          created_at?: string
          updated_at?: string
          version?: number
        }
        Update: {
          id?: string
          team_id?: string | null
          name?: string
          description?: string | null
          schema?: any
          is_active?: boolean
          created_at?: string
          updated_at?: string
          version?: number
        }
      }
      workflow_executions: {
        Row: {
          id: string
          workflow_id: string
          status: 'running' | 'completed' | 'failed' | 'cancelled'
          input_data: any // JSONB
          output_data: any // JSONB
          execution_log: any[] // JSONB[]
          started_at: string
          completed_at: string | null
          error: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          workflow_id: string
          status: 'running' | 'completed' | 'failed' | 'cancelled'
          input_data?: any
          output_data?: any
          execution_log?: any[]
          started_at?: string
          completed_at?: string | null
          error?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          workflow_id?: string
          status?: 'running' | 'completed' | 'failed' | 'cancelled'
          input_data?: any
          output_data?: any
          execution_log?: any[]
          started_at?: string
          completed_at?: string | null
          error?: string | null
          created_by?: string | null
        }
      }
      workflow_templates: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string
          schema: any // JSONB
          is_public: boolean
          created_by: string
          created_at: string
          updated_at: string
          usage_count: number
          rating: number
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: string
          schema: any
          is_public?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
          usage_count?: number
          rating?: number
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string
          schema?: any
          is_public?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
          usage_count?: number
          rating?: number
        }
      }
    }
  }
}

export class WorkflowPersistence {
  private supabase: ReturnType<typeof createClient<Database>>

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('Supabase configuration is incomplete. Some features may not work.')
      // Create a mock client to prevent build errors
      this.supabase = {
        from: () => ({
          select: () => ({ single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) }),
          insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) }) }),
          update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) }) }) }),
          delete: () => ({ eq: () => Promise.resolve({ error: new Error('Supabase not configured') }) }),
          eq: () => ({ single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) }),
          order: () => ({ range: () => Promise.resolve({ data: [], error: new Error('Supabase not configured'), count: 0 }) }),
          range: () => Promise.resolve({ data: [], error: new Error('Supabase not configured'), count: 0 })
        })
      } as any
      return
    }
    this.supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)
  }

  // Workflow CRUD operations
  async createWorkflow(
    workflow: Omit<WorkflowSchema, 'id' | 'created_at' | 'updated_at'>,
    teamId?: string
  ): Promise<WorkflowSchema> {
    const workflowData = {
      name: workflow.name,
      description: workflow.description,
      schema: {
        fragments: workflow.fragments,
        connections: workflow.connections,
        variables: workflow.variables,
        triggers: workflow.triggers
      },
      team_id: teamId,
      version: workflow.version,
      is_active: true
    }

    const { data, error } = await this.supabase
      .from('workflows')
      .insert(workflowData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create workflow: ${error.message}`)
    }

    return this.mapDbRowToWorkflow(data)
  }

  async getWorkflow(id: string): Promise<WorkflowSchema | null> {
    const { data, error } = await this.supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Failed to get workflow: ${error.message}`)
    }

    return this.mapDbRowToWorkflow(data)
  }

  async updateWorkflow(
    id: string,
    updates: Partial<Omit<WorkflowSchema, 'id' | 'created_at'>>
  ): Promise<WorkflowSchema> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (updates.name) updateData.name = updates.name
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.version) updateData.version = updates.version

    if (updates.fragments || updates.connections || updates.variables || updates.triggers) {
      // Get current schema
      const current = await this.getWorkflow(id)
      if (!current) throw new Error('Workflow not found')

      updateData.schema = {
        fragments: updates.fragments || current.fragments,
        connections: updates.connections || current.connections,
        variables: updates.variables || current.variables,
        triggers: updates.triggers || current.triggers
      }
    }

    const { data, error } = await this.supabase
      .from('workflows')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update workflow: ${error.message}`)
    }

    return this.mapDbRowToWorkflow(data)
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('workflows')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete workflow: ${error.message}`)
    }

    return true
  }

  async listWorkflows(
    teamId?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ workflows: WorkflowSchema[]; total: number }> {
    let query = this.supabase
      .from('workflows')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (teamId) {
      query = query.eq('team_id', teamId)
    }

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to list workflows: ${error.message}`)
    }

    return {
      workflows: data.map(row => this.mapDbRowToWorkflow(row)),
      total: count || 0
    }
  }

  // Workflow execution operations
  async createExecution(execution: WorkflowExecution): Promise<WorkflowExecution> {
    const executionData = {
      id: execution.id,
      workflow_id: execution.workflowId,
      status: execution.status,
      input_data: execution.inputData,
      output_data: execution.outputData,
      execution_log: execution.executionLog,
      started_at: execution.startedAt.toISOString(),
      completed_at: execution.completedAt?.toISOString() || null,
      error: execution.error || null
    }

    const { data, error } = await this.supabase
      .from('workflow_executions')
      .insert(executionData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create execution: ${error.message}`)
    }

    return this.mapDbRowToExecution(data)
  }

  async updateExecution(
    id: string,
    updates: Partial<WorkflowExecution>
  ): Promise<WorkflowExecution> {
    const updateData: any = {}

    if (updates.status) updateData.status = updates.status
    if (updates.outputData) updateData.output_data = updates.outputData
    if (updates.executionLog) updateData.execution_log = updates.executionLog
    if (updates.completedAt) updateData.completed_at = updates.completedAt.toISOString()
    if (updates.error !== undefined) updateData.error = updates.error

    const { data, error } = await this.supabase
      .from('workflow_executions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update execution: ${error.message}`)
    }

    return this.mapDbRowToExecution(data)
  }

  async getExecution(id: string): Promise<WorkflowExecution | null> {
    const { data, error } = await this.supabase
      .from('workflow_executions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Failed to get execution: ${error.message}`)
    }

    return this.mapDbRowToExecution(data)
  }

  async listExecutions(
    workflowId?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ executions: WorkflowExecution[]; total: number }> {
    let query = this.supabase
      .from('workflow_executions')
      .select('*', { count: 'exact' })
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (workflowId) {
      query = query.eq('workflow_id', workflowId)
    }

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to list executions: ${error.message}`)
    }

    return {
      executions: data.map(row => this.mapDbRowToExecution(row)),
      total: count || 0
    }
  }

  // Template operations
  async createTemplate(
    template: {
      name: string
      description?: string
      category: string
      schema: any
      isPublic?: boolean
      createdBy: string
    }
  ): Promise<any> {
    const templateData = {
      name: template.name,
      description: template.description,
      category: template.category,
      schema: template.schema,
      is_public: template.isPublic || false,
      created_by: template.createdBy,
      usage_count: 0,
      rating: 0
    }

    const { data, error } = await this.supabase
      .from('workflow_templates')
      .insert(templateData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create template: ${error.message}`)
    }

    return data
  }

  async listTemplates(
    category?: string,
    isPublic?: boolean,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ templates: any[]; total: number }> {
    let query = this.supabase
      .from('workflow_templates')
      .select('*', { count: 'exact' })
      .order('usage_count', { ascending: false })
      .range(offset, offset + limit - 1)

    if (category) {
      query = query.eq('category', category)
    }

    if (isPublic !== undefined) {
      query = query.eq('is_public', isPublic)
    }

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to list templates: ${error.message}`)
    }

    return {
      templates: data || [],
      total: count || 0
    }
  }

  // Private helper methods
  private mapDbRowToWorkflow(row: any): WorkflowSchema {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      fragments: row.schema.fragments || [],
      connections: row.schema.connections || [],
      variables: row.schema.variables || [],
      triggers: row.schema.triggers || [],
      version: row.version,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    }
  }

  private mapDbRowToExecution(row: any): WorkflowExecution {
    return {
      id: row.id,
      workflowId: row.workflow_id,
      status: row.status,
      startedAt: new Date(row.started_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      inputData: row.input_data || {},
      outputData: row.output_data,
      executionLog: row.execution_log || [],
      error: row.error
    }
  }
}

// Singleton instance
export const workflowPersistence = new WorkflowPersistence()

// Database migration SQL (to be run via Supabase CLI or dashboard)
export const migrationSQL = `
-- Create workflows table
CREATE TABLE IF NOT EXISTS public.workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    schema JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workflow_executions table
CREATE TABLE IF NOT EXISTS public.workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('running', 'completed', 'failed', 'cancelled')) NOT NULL,
    input_data JSONB DEFAULT '{}',
    output_data JSONB,
    execution_log JSONB[] DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create workflow_templates table
CREATE TABLE IF NOT EXISTS public.workflow_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    schema JSONB NOT NULL,
    is_public BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(2,1) DEFAULT 0.0
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workflows_team_id ON public.workflows(team_id);
CREATE INDEX IF NOT EXISTS idx_workflows_is_active ON public.workflows(is_active);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON public.workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON public.workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON public.workflow_templates(category);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_is_public ON public.workflow_templates(is_public);

-- Create RLS policies
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;

-- Workflows policies
CREATE POLICY "Users can view their own workflows" ON public.workflows
    FOR SELECT USING (auth.uid() = team_id);

CREATE POLICY "Users can create workflows" ON public.workflows
    FOR INSERT WITH CHECK (auth.uid() = team_id);

CREATE POLICY "Users can update their own workflows" ON public.workflows
    FOR UPDATE USING (auth.uid() = team_id);

CREATE POLICY "Users can delete their own workflows" ON public.workflows
    FOR DELETE USING (auth.uid() = team_id);

-- Executions policies
CREATE POLICY "Users can view executions of their workflows" ON public.workflow_executions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.workflows 
            WHERE workflows.id = workflow_executions.workflow_id 
            AND workflows.team_id = auth.uid()
        )
    );

CREATE POLICY "Users can create executions for their workflows" ON public.workflow_executions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workflows 
            WHERE workflows.id = workflow_executions.workflow_id 
            AND workflows.team_id = auth.uid()
        )
    );

CREATE POLICY "Users can update executions of their workflows" ON public.workflow_executions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.workflows 
            WHERE workflows.id = workflow_executions.workflow_id 
            AND workflows.team_id = auth.uid()
        )
    );

-- Templates policies
CREATE POLICY "Users can view public templates" ON public.workflow_templates
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own templates" ON public.workflow_templates
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create templates" ON public.workflow_templates
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own templates" ON public.workflow_templates
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own templates" ON public.workflow_templates
    FOR DELETE USING (auth.uid() = created_by);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_workflows_updated_at
    BEFORE UPDATE ON public.workflows
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workflow_templates_updated_at
    BEFORE UPDATE ON public.workflow_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
`
