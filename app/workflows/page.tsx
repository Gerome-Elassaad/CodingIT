'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WorkflowCanvas } from '@/components/workflow-builder/workflow-canvas'
import { WorkflowSchema } from '@/lib/workflow-engine'
import { Plus, Search, Play, Edit, Trash2, Copy, GitBranch } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { useAuth } from '@/lib/auth'
import { ViewType } from '@/components/auth'

export default function WorkflowsPage() {
  const [authDialog, setAuthDialog] = useState(false)
  const [authView, setAuthView] = useState<ViewType>('sign_in')
  const { session } = useAuth(setAuthDialog, setAuthView)
  const [workflows, setWorkflows] = useState<WorkflowSchema[]>([])
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowSchema | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Load workflows
  useEffect(() => {
    if (session?.user?.id) {
      loadWorkflows()
    }
  }, [session?.user?.id])

  const loadWorkflows = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/workflows')
      if (!response.ok) throw new Error('Failed to load workflows')
      
      const data = await response.json()
      setWorkflows(data.workflows || [])
    } catch (error) {
      console.error('Error loading workflows:', error)
      toast({
        title: "Error",
        description: "Failed to load workflows",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createWorkflow = async () => {
    if (!session?.user?.id) return

    setIsCreating(true)
    try {
      const newWorkflow = {
        name: 'New Workflow',
        description: 'A new workflow',
        fragments: [],
        connections: [],
        variables: [],
        triggers: []
      }

      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWorkflow)
      })

      if (!response.ok) throw new Error('Failed to create workflow')

      const workflow = await response.json()
      setWorkflows(prev => [workflow, ...prev])
      setSelectedWorkflow(workflow)
      
      toast({
        title: "Success",
        description: "New workflow created",
      })
    } catch (error) {
      console.error('Error creating workflow:', error)
      toast({
        title: "Error",
        description: "Failed to create workflow",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const updateWorkflow = async (workflow: WorkflowSchema) => {
    try {
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflow)
      })

      if (!response.ok) throw new Error('Failed to update workflow')

      const updatedWorkflow = await response.json()
      setWorkflows(prev => 
        prev.map(w => w.id === updatedWorkflow.id ? updatedWorkflow : w)
      )
      setSelectedWorkflow(updatedWorkflow)
    } catch (error) {
      console.error('Error updating workflow:', error)
      toast({
        title: "Error",
        description: "Failed to update workflow",
        variant: "destructive",
      })
    }
  }

  const executeWorkflow = async (workflow: WorkflowSchema) => {
    try {
      const response = await fetch(`/api/workflows/${workflow.id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputData: {} })
      })

      if (!response.ok) throw new Error('Failed to execute workflow')

      const result = await response.json()
      
      toast({
        title: "Workflow Executed",
        description: `Execution started with ID: ${result.executionId}`,
      })
    } catch (error) {
      console.error('Error executing workflow:', error)
      toast({
        title: "Error",
        description: "Failed to execute workflow",
        variant: "destructive",
      })
    }
  }

  const deleteWorkflow = async (workflowId: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return

    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete workflow')

      setWorkflows(prev => prev.filter(w => w.id !== workflowId))
      if (selectedWorkflow?.id === workflowId) {
        setSelectedWorkflow(null)
      }
      
      toast({
        title: "Success",
        description: "Workflow deleted",
      })
    } catch (error) {
      console.error('Error deleting workflow:', error)
      toast({
        title: "Error",
        description: "Failed to delete workflow",
        variant: "destructive",
      })
    }
  }

  const filteredWorkflows = workflows.filter(workflow =>
    workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workflow.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!session?.user?.id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to access workflows
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 h-screen flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Workflows</h1>
          <p className="text-muted-foreground">
            Build and manage multi-step automation workflows
          </p>
        </div>
        <Button onClick={createWorkflow} disabled={isCreating}>
          <Plus className="w-4 h-4 mr-2" />
          {isCreating ? 'Creating...' : 'New Workflow'}
        </Button>
      </div>

      <Tabs defaultValue="list" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Workflow List</TabsTrigger>
          <TabsTrigger value="builder" disabled={!selectedWorkflow}>
            Builder {selectedWorkflow && `- ${selectedWorkflow.name}`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="flex-1">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search workflows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredWorkflows.map((workflow) => (
                  <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="truncate">{workflow.name}</CardTitle>
                        <Badge variant="secondary">
                          {workflow.fragments.length} nodes
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {workflow.description || 'No description'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-2">
                          <GitBranch className="w-4 h-4" />
                          {workflow.connections.length} connections
                        </div>
                        <div>
                          v{workflow.version}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedWorkflow(workflow)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => executeWorkflow(workflow)}
                          disabled={workflow.fragments.length === 0}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Run
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteWorkflow(workflow.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {filteredWorkflows.length === 0 && !isLoading && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm ? 'No workflows found matching your search.' : 'No workflows yet. Create your first workflow!'}
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="builder" className="flex-1">
          {selectedWorkflow ? (
            <WorkflowCanvas
              workflow={selectedWorkflow}
              onWorkflowUpdate={updateWorkflow}
              onExecute={executeWorkflow}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Select a workflow to start building</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}