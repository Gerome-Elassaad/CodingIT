'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DeploymentDashboard } from '@/components/deployment/deployment-dashboard'
import { DeploymentForm } from '@/components/deployment/deployment-form'
import { DeploymentHistory } from '@/components/deployment/deployment-history'
import { DeploymentMonitoring } from '@/components/deployment/deployment-monitoring'
import { DeploymentResult, DeploymentStatus } from '@/lib/deployment/deployment-engine'
import { FragmentSchema } from '@/lib/schema'
import { 
  Rocket, 
  History, 
  Monitor, 
  Settings, 
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { useAuth } from '@/lib/auth'
import { ViewType } from '@/components/auth'

export default function DeploymentsPage() {
  const [authDialog, setAuthDialog] = useState(false)
  const [authView, setAuthView] = useState<ViewType>('sign_in')
  const { session } = useAuth(setAuthDialog, setAuthView)
  const [deployments, setDeployments] = useState<DeploymentResult[]>([])
  const [activeDeployments, setActiveDeployments] = useState<DeploymentStatus[]>([])
  const [selectedFragment, setSelectedFragment] = useState<FragmentSchema | null>(null)
  const [isDeploying, setIsDeploying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Load deployments
  useEffect(() => {
    if (session?.user?.id) {
      loadDeployments()
    }
  }, [session?.user?.id])

  const loadDeployments = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/deployments')
      if (!response.ok) throw new Error('Failed to load deployments')
      
      const data = await response.json()
      setDeployments(data.deployments || [])
    } catch (error) {
      console.error('Error loading deployments:', error)
      toast({
        title: "Error",
        description: "Failed to load deployments",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const deployFragment = async (fragment: FragmentSchema, config: any) => {
    if (!session?.user?.id) return

    setIsDeploying(true)
    try {
      const response = await fetch('/api/deployments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fragment, config })
      })

      if (!response.ok) throw new Error('Failed to deploy fragment')

      const result = await response.json()
      
      // Add to deployments list
      setDeployments(prev => [result, ...prev])
      
      // Start polling for status updates
      pollDeploymentStatus(result.deploymentId)
      
      toast({
        title: "Deployment Started",
        description: `Deployment ${result.deploymentId} is now building`,
      })
    } catch (error) {
      console.error('Error deploying fragment:', error)
      toast({
        title: "Error",
        description: "Failed to deploy fragment",
        variant: "destructive",
      })
    } finally {
      setIsDeploying(false)
    }
  }

  const pollDeploymentStatus = async (deploymentId: string) => {
    const maxPolls = 60 // 5 minutes max
    let polls = 0
    
    const poll = async () => {
      if (polls >= maxPolls) return
      
      try {
        const response = await fetch(`/api/deployments/${deploymentId}`)
        if (!response.ok) throw new Error('Failed to get deployment status')
        
        const status = await response.json()
        
        // Update active deployments
        setActiveDeployments(prev => {
          const filtered = prev.filter(d => d.deploymentId !== deploymentId)
          if (status.status === 'building' || status.status === 'deploying') {
            return [...filtered, status]
          }
          return filtered
        })
        
        if (status.status === 'success' || status.status === 'failed') {
          // Update deployments list
          setDeployments(prev => prev.map(d => 
            d.deploymentId === deploymentId 
              ? { ...d, status: status.status, url: status.url }
              : d
          ))
          
          if (status.status === 'success') {
            toast({
              title: "Deployment Successful",
              description: `Deployment is now live at ${status.url}`,
            })
          } else {
            toast({
              title: "Deployment Failed",
              description: status.error || "Deployment failed",
              variant: "destructive",
            })
          }
        } else {
          polls++
          setTimeout(poll, 5000) // Poll every 5 seconds
        }
      } catch (error) {
        console.error('Error polling deployment status:', error)
      }
    }
    
    poll()
  }

  const cancelDeployment = async (deploymentId: string) => {
    try {
      const response = await fetch(`/api/deployments/${deploymentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to cancel deployment')

      // Remove from active deployments
      setActiveDeployments(prev => prev.filter(d => d.deploymentId !== deploymentId))
      
      toast({
        title: "Deployment Cancelled",
        description: `Deployment ${deploymentId} has been cancelled`,
      })
    } catch (error) {
      console.error('Error cancelling deployment:', error)
      toast({
        title: "Error",
        description: "Failed to cancel deployment",
        variant: "destructive",
      })
    }
  }

  const rollbackDeployment = async (deploymentId: string) => {
    try {
      const response = await fetch(`/api/deployments/${deploymentId}/rollback`, {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Failed to rollback deployment')

      toast({
        title: "Rollback Initiated",
        description: `Rollback for deployment ${deploymentId} has been initiated`,
      })
    } catch (error) {
      console.error('Error rolling back deployment:', error)
      toast({
        title: "Error",
        description: "Failed to rollback deployment",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'building':
      case 'deploying':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'building':
      case 'deploying':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!session?.user?.id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to access deployments
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
          <h1 className="text-3xl font-bold">Deployments</h1>
          <p className="text-muted-foreground">
            Deploy and manage your applications
          </p>
        </div>
        <Button onClick={() => setSelectedFragment({} as FragmentSchema)} disabled={isDeploying}>
          <Rocket className="w-4 h-4 mr-2" />
          {isDeploying ? 'Deploying...' : 'New Deployment'}
        </Button>
      </div>

      {/* Active Deployments */}
      {activeDeployments.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Active Deployments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeDeployments.map((deployment) => (
                <div key={deployment.deploymentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(deployment.status)}
                    <div>
                      <div className="font-medium">{deployment.deploymentId}</div>
                      <div className="text-sm text-muted-foreground">
                        {deployment.currentStep} ({deployment.progress}%)
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(deployment.status)}>
                      {deployment.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelDeployment(deployment.deploymentId)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="dashboard" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="deploy">Deploy</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="flex-1">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Deployments</CardTitle>
                  <Rocket className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{deployments.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {deployments.filter(d => d.status === 'success').length} successful
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Deployments</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeDeployments.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Currently running
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {deployments.length ? Math.round((deployments.filter(d => d.status === 'success').length / deployments.length) * 100) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Last 30 days
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Build Time</CardTitle>
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {deployments.length ? Math.round(deployments.reduce((acc, d) => acc + d.buildTime, 0) / deployments.length / 1000) : 0}s
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Average build time
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Deployments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {deployments.slice(0, 5).map((deployment) => (
                    <div key={deployment.deploymentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(deployment.status)}
                        <div>
                          <div className="font-medium">{deployment.deploymentId}</div>
                          <div className="text-sm text-muted-foreground">
                            {deployment.deployedAt ? new Date(deployment.deployedAt).toLocaleString() : 'Recently deployed'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(deployment.status)}>
                          {deployment.status}
                        </Badge>
                        {deployment.url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(deployment.url, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {deployments.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No deployments yet. Create your first deployment!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="deploy" className="flex-1">
          <DeploymentForm
            onDeploy={(config) => deployFragment(selectedFragment as FragmentSchema, config)}
            isDeploying={isDeploying}
          />
        </TabsContent>

        <TabsContent value="history" className="flex-1">
          <DeploymentHistory
            deployments={deployments}
            onRedeploy={() => {}} // TODO: implement redeploy logic
            onRollback={(deployment) => rollbackDeployment(deployment.deploymentId)}
          />
        </TabsContent>

        <TabsContent value="monitoring" className="flex-1">
          <DeploymentMonitoring
            deployments={deployments.filter(d => d.status === 'success')}
            onRefresh={loadDeployments}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}