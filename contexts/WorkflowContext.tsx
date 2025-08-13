'use client'

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react'
import useAsyncState from '@/hooks/useAsyncState'
import { API_BASE_URL } from '@/lib/config'

// Types
export interface WorkflowNode {
  id: string
  type: 'fragment' | 'condition' | 'loop' | 'trigger'
  position: { x: number; y: number }
  data: {
    title: string
    description?: string
    template?: string
    code?: string
    config?: Record<string, any>
    inputs?: WorkflowPort[]
    outputs?: WorkflowPort[]
  }
}

export interface WorkflowPort {
  id: string
  type: 'input' | 'output'
  dataType: 'string' | 'number' | 'boolean' | 'object' | 'array'
  required?: boolean
}

export interface WorkflowConnection {
  id: string
  source: { nodeId: string; portId: string }
  target: { nodeId: string; portId: string }
  dataType: string
}

export interface WorkflowVariable {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  value?: any
  description?: string
}

export interface WorkflowTrigger {
  id: string
  type: 'manual' | 'webhook' | 'scheduled' | 'file_change'
  config: Record<string, any>
  enabled: boolean
}

export interface Workflow {
  id?: string
  name: string
  description?: string
  nodes: WorkflowNode[]
  connections: WorkflowConnection[]
  variables: WorkflowVariable[]
  triggers: WorkflowTrigger[]
  metadata?: {
    createdAt?: string
    updatedAt?: string
    version?: number
  }
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  startedAt: string
  completedAt?: string
  error?: string
  results?: Record<string, any>
  logs?: Array<{
    timestamp: string
    level: 'info' | 'warn' | 'error'
    message: string
    nodeId?: string
  }>
}

// State
interface WorkflowState {
  currentWorkflow: Workflow | null
  workflows: Workflow[]
  executions: WorkflowExecution[]
  selectedNode: string | null
  selectedConnection: string | null
  isDirty: boolean
  viewport: {
    x: number
    y: number
    zoom: number
  }
}

// Actions
type WorkflowAction =
  | { type: 'SET_CURRENT_WORKFLOW'; payload: Workflow | null }
  | { type: 'SET_WORKFLOWS'; payload: Workflow[] }
  | { type: 'UPDATE_WORKFLOW'; payload: Partial<Workflow> }
  | { type: 'ADD_NODE'; payload: WorkflowNode }
  | { type: 'UPDATE_NODE'; payload: { id: string; updates: Partial<WorkflowNode> } }
  | { type: 'DELETE_NODE'; payload: string }
  | { type: 'ADD_CONNECTION'; payload: WorkflowConnection }
  | { type: 'DELETE_CONNECTION'; payload: string }
  | { type: 'SET_SELECTED_NODE'; payload: string | null }
  | { type: 'SET_SELECTED_CONNECTION'; payload: string | null }
  | { type: 'SET_DIRTY'; payload: boolean }
  | { type: 'UPDATE_VIEWPORT'; payload: Partial<WorkflowState['viewport']> }
  | { type: 'SET_EXECUTIONS'; payload: WorkflowExecution[] }
  | { type: 'ADD_EXECUTION'; payload: WorkflowExecution }
  | { type: 'UPDATE_EXECUTION'; payload: { id: string; updates: Partial<WorkflowExecution> } }

// Reducer
function workflowReducer(state: WorkflowState, action: WorkflowAction): WorkflowState {
  switch (action.type) {
    case 'SET_CURRENT_WORKFLOW':
      return { ...state, currentWorkflow: action.payload, isDirty: false }
    
    case 'SET_WORKFLOWS':
      return { ...state, workflows: action.payload }
    
    case 'UPDATE_WORKFLOW':
      if (!state.currentWorkflow) return state
      return {
        ...state,
        currentWorkflow: { ...state.currentWorkflow, ...action.payload },
        isDirty: true
      }
    
    case 'ADD_NODE':
      if (!state.currentWorkflow) return state
      return {
        ...state,
        currentWorkflow: {
          ...state.currentWorkflow,
          nodes: [...state.currentWorkflow.nodes, action.payload]
        },
        isDirty: true
      }
    
    case 'UPDATE_NODE':
      if (!state.currentWorkflow) return state
      return {
        ...state,
        currentWorkflow: {
          ...state.currentWorkflow,
          nodes: state.currentWorkflow.nodes.map(node =>
            node.id === action.payload.id
              ? { ...node, ...action.payload.updates }
              : node
          )
        },
        isDirty: true
      }
    
    case 'DELETE_NODE':
      if (!state.currentWorkflow) return state
      return {
        ...state,
        currentWorkflow: {
          ...state.currentWorkflow,
          nodes: state.currentWorkflow.nodes.filter(node => node.id !== action.payload),
          connections: state.currentWorkflow.connections.filter(
            conn => conn.source.nodeId !== action.payload && conn.target.nodeId !== action.payload
          )
        },
        selectedNode: state.selectedNode === action.payload ? null : state.selectedNode,
        isDirty: true
      }
    
    case 'ADD_CONNECTION':
      if (!state.currentWorkflow) return state
      return {
        ...state,
        currentWorkflow: {
          ...state.currentWorkflow,
          connections: [...state.currentWorkflow.connections, action.payload]
        },
        isDirty: true
      }
    
    case 'DELETE_CONNECTION':
      if (!state.currentWorkflow) return state
      return {
        ...state,
        currentWorkflow: {
          ...state.currentWorkflow,
          connections: state.currentWorkflow.connections.filter(conn => conn.id !== action.payload)
        },
        selectedConnection: state.selectedConnection === action.payload ? null : state.selectedConnection,
        isDirty: true
      }
    
    case 'SET_SELECTED_NODE':
      return { ...state, selectedNode: action.payload, selectedConnection: null }
    
    case 'SET_SELECTED_CONNECTION':
      return { ...state, selectedConnection: action.payload, selectedNode: null }
    
    case 'SET_DIRTY':
      return { ...state, isDirty: action.payload }
    
    case 'UPDATE_VIEWPORT':
      return {
        ...state,
        viewport: { ...state.viewport, ...action.payload }
      }
    
    case 'SET_EXECUTIONS':
      return { ...state, executions: action.payload }
    
    case 'ADD_EXECUTION':
      return {
        ...state,
        executions: [action.payload, ...state.executions]
      }
    
    case 'UPDATE_EXECUTION':
      return {
        ...state,
        executions: state.executions.map(exec =>
          exec.id === action.payload.id
            ? { ...exec, ...action.payload.updates }
            : exec
        )
      }
    
    default:
      return state
  }
}

// Context
interface WorkflowContextType extends WorkflowState {
  // Workflow operations
  createWorkflow: (workflow: Omit<Workflow, 'id'>) => Promise<Workflow>
  loadWorkflow: (id: string) => Promise<void>
  saveWorkflow: () => Promise<void>
  deleteWorkflow: (id: string) => Promise<void>
  duplicateWorkflow: (id: string) => Promise<Workflow>
  
  // Node operations
  addNode: (node: Omit<WorkflowNode, 'id'>) => void
  updateNode: (id: string, updates: Partial<WorkflowNode>) => void
  deleteNode: (id: string) => void
  
  // Connection operations
  addConnection: (connection: Omit<WorkflowConnection, 'id'>) => void
  deleteConnection: (id: string) => void
  
  // Selection
  setSelectedNode: (id: string | null) => void
  setSelectedConnection: (id: string | null) => void
  
  // Execution
  executeWorkflow: (inputData?: Record<string, any>) => Promise<WorkflowExecution>
  stopExecution: (executionId: string) => Promise<void>
  loadExecutions: (workflowId: string) => Promise<void>
  
  // Viewport
  updateViewport: (updates: Partial<WorkflowState['viewport']>) => void
  
  // Loading states
  loading: boolean
  error: Error | null
}

const WorkflowContext = createContext<WorkflowContextType | null>(null)

// Provider
interface WorkflowProviderProps {
  children: ReactNode
}

export function WorkflowProvider({ children }: WorkflowProviderProps) {
  const [state, dispatch] = useReducer(workflowReducer, {
    currentWorkflow: null,
    workflows: [],
    executions: [],
    selectedNode: null,
    selectedConnection: null,
    isDirty: false,
    viewport: { x: 0, y: 0, zoom: 1 }
  })

  const { loading, error, execute } = useAsyncState()

  // Workflow operations
  const createWorkflow = useCallback(async (workflow: Omit<Workflow, 'id'>) => {
    return execute(async () => {
      const response = await fetch(`${API_BASE_URL}/api/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflow)
      })
      
      if (!response.ok) {
        throw new Error(`Failed to create workflow: ${response.statusText}`)
      }
      
      const newWorkflow = await response.json()
      dispatch({ type: 'SET_CURRENT_WORKFLOW', payload: newWorkflow.data })
      return newWorkflow.data
    })
  }, [execute])

  const loadWorkflow = useCallback(async (id: string) => {
    return execute(async () => {
      const response = await fetch(`${API_BASE_URL}/api/workflows/${id}`)
      
      if (!response.ok) {
        throw new Error(`Failed to load workflow: ${response.statusText}`)
      }
      
      const workflow = await response.json()
      dispatch({ type: 'SET_CURRENT_WORKFLOW', payload: workflow.data })
    })
  }, [execute])

  const saveWorkflow = useCallback(async () => {
    if (!state.currentWorkflow) return
    
    return execute(async () => {
      const response = await fetch(`${API_BASE_URL}/api/workflows/${state.currentWorkflow!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.currentWorkflow)
      })
      
      if (!response.ok) {
        throw new Error(`Failed to save workflow: ${response.statusText}`)
      }
      
      dispatch({ type: 'SET_DIRTY', payload: false })
    })
  }, [state.currentWorkflow, execute])

  const deleteWorkflow = useCallback(async (id: string) => {
    return execute(async () => {
      const response = await fetch(`${API_BASE_URL}/api/workflows/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error(`Failed to delete workflow: ${response.statusText}`)
      }
      
      if (state.currentWorkflow?.id === id) {
        dispatch({ type: 'SET_CURRENT_WORKFLOW', payload: null })
      }
    })
  }, [state.currentWorkflow, execute])

  const duplicateWorkflow = useCallback(async (id: string) => {
    return execute(async () => {
      const response = await fetch(`${API_BASE_URL}/api/workflows/${id}/duplicate`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error(`Failed to duplicate workflow: ${response.statusText}`)
      }
      
      const duplicatedWorkflow = await response.json()
      return duplicatedWorkflow.data
    })
  }, [execute])

  const executeWorkflow = useCallback(async (inputData?: Record<string, any>) => {
    if (!state.currentWorkflow) {
      throw new Error('No workflow selected')
    }
    
    return execute(async () => {
      const response = await fetch(`${API_BASE_URL}/api/workflows/${state.currentWorkflow!.id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputData })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to execute workflow: ${response.statusText}`)
      }
      
      const execution = await response.json()
      dispatch({ type: 'ADD_EXECUTION', payload: execution.data })
      return execution.data
    })
  }, [state.currentWorkflow, execute])

  const stopExecution = useCallback(async (executionId: string) => {
    return execute(async () => {
      const response = await fetch(`${API_BASE_URL}/api/workflows/executions/${executionId}/stop`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error(`Failed to stop execution: ${response.statusText}`)
      }
      
      dispatch({
        type: 'UPDATE_EXECUTION',
        payload: { id: executionId, updates: { status: 'cancelled' } }
      })
    })
  }, [execute])

  const loadExecutions = useCallback(async (workflowId: string) => {
    return execute(async () => {
      const response = await fetch(`${API_BASE_URL}/api/workflows/${workflowId}/executions`)
      
      if (!response.ok) {
        throw new Error(`Failed to load executions: ${response.statusText}`)
      }
      
      const executions = await response.json()
      dispatch({ type: 'SET_EXECUTIONS', payload: executions.data })
    })
  }, [execute])

  // Node operations
  const addNode = useCallback((node: Omit<WorkflowNode, 'id'>) => {
    const newNode = {
      ...node,
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    dispatch({ type: 'ADD_NODE', payload: newNode })
  }, [])

  const updateNode = useCallback((id: string, updates: Partial<WorkflowNode>) => {
    dispatch({ type: 'UPDATE_NODE', payload: { id, updates } })
  }, [])

  const deleteNode = useCallback((id: string) => {
    dispatch({ type: 'DELETE_NODE', payload: id })
  }, [])

  // Connection operations
  const addConnection = useCallback((connection: Omit<WorkflowConnection, 'id'>) => {
    const newConnection = {
      ...connection,
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    dispatch({ type: 'ADD_CONNECTION', payload: newConnection })
  }, [])

  const deleteConnection = useCallback((id: string) => {
    dispatch({ type: 'DELETE_CONNECTION', payload: id })
  }, [])

  // Selection
  const setSelectedNode = useCallback((id: string | null) => {
    dispatch({ type: 'SET_SELECTED_NODE', payload: id })
  }, [])

  const setSelectedConnection = useCallback((id: string | null) => {
    dispatch({ type: 'SET_SELECTED_CONNECTION', payload: id })
  }, [])

  // Viewport
  const updateViewport = useCallback((updates: Partial<WorkflowState['viewport']>) => {
    dispatch({ type: 'UPDATE_VIEWPORT', payload: updates })
  }, [])

  const contextValue: WorkflowContextType = {
    ...state,
    createWorkflow,
    loadWorkflow,
    saveWorkflow,
    deleteWorkflow,
    duplicateWorkflow,
    addNode,
    updateNode,
    deleteNode,
    addConnection,
    deleteConnection,
    setSelectedNode,
    setSelectedConnection,
    executeWorkflow,
    stopExecution,
    loadExecutions,
    updateViewport,
    loading,
    error
  }

  return (
    <WorkflowContext.Provider value={contextValue}>
      {children}
    </WorkflowContext.Provider>
  )
}

// Hook
export function useWorkflow() {
  const context = useContext(WorkflowContext)
  
  if (!context) {
    throw new Error('useWorkflow must be used within a WorkflowProvider')
  }
  
  return context
}

export default WorkflowContext