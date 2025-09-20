'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { 
  Mail, 
  Calendar, 
  FolderOpen, 
  Plus, 
  Unlink,
  Loader2,
  ExternalLink,
  RefreshCw
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth'
import { 
  getUserIntegrations, 
  upsertUserIntegration, 
  disconnectUserIntegration,
} from '@/lib/user-settings'
import { UserIntegration } from '@/lib/database.types'
import { GitHubIcon } from '@/components/icons'
import { SiSupabase } from 'react-icons/si'

const availableIntegrations = [
  {
    id: 'GitHub',
    name: 'GitHub', 
    description: 'Import and export files from your GitHub repositories',
    icon: GitHubIcon,
    color: 'bg-grey-600 text-white'
  },
  {
    id: 'Supabase',
    name: 'Supabase',
    description: 'Integrate your database and authentication',
    icon: SiSupabase,
    color: 'bg-grey-600 text-white'
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Schedule meetings and manage your calendar',
    icon: Calendar,
    color: 'bg-green-600 text-white'
  }
]

export default function IntegrationsSettings() {
  const { session } = useAuth(() => {}, () => {})
  const { toast } = useToast()
  
  const [integrations, setIntegrations] = useState<UserIntegration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const loadIntegrations = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      console.log('Loading integrations for user:', session.user.id)
      const userIntegrations = await getUserIntegrations(session.user.id)
      console.log('Loaded integrations:', userIntegrations)
      setIntegrations(userIntegrations)
    } catch (error) {
      console.error('Error loading integrations:', error)
      toast({
        title: "Error",
        description: "Failed to load integrations. Please try again.",
        variant: "destructive",
      })
    }
  }, [session?.user?.id, toast])

  useEffect(() => {
    if (!session?.user?.id) {
      setIsLoading(false)
      return
    }

    const initializeIntegrations = async () => {
      setIsLoading(true)
      await loadIntegrations()
      setIsLoading(false)
    }

    initializeIntegrations()
  }, [session?.user?.id, loadIntegrations])


  const getIntegrationStatus = useCallback((serviceId: string) => {
    const integration = integrations.find(integration => integration.service_name === serviceId)
    console.log(`Integration status for ${serviceId}:`, integration)
    return integration
  }, [integrations])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadIntegrations()
    setRefreshing(false)
    toast({
      title: "Refreshed",
      description: "Integration status updated.",
    })
  }

  const handleConnect = async (serviceId: string) => {
    if (!session?.user?.id) {
      toast({
        title: "Error",
        description: "Please log in to connect integrations.",
        variant: "destructive",
      })
      return
    }

    setConnecting(serviceId)
    
    try {
      console.log(`Connecting ${serviceId} for user:`, session.user.id)
      
      const success = await upsertUserIntegration(session.user.id, serviceId, {
        is_connected: true,
        connection_data: {
          connected_at: new Date().toISOString(),
          simulated: true,
        }
      })

      if (success) {
        await loadIntegrations()
        
        toast({
          title: "Success",
          description: `${availableIntegrations.find(int => int.id === serviceId)?.name} connected successfully.`,
        })
      } else {
        throw new Error('Failed to save integration to database')
      }
    } catch (error) {
      console.error('Error connecting service:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to connect service. Please try again.",
        variant: "destructive",
      })
    } finally {
      setConnecting(null)
    }
  }

  const handleDisconnect = async (serviceId: string) => {
    if (!session?.user?.id) return

    setDisconnecting(serviceId)
    
    try {
      console.log(`Disconnecting ${serviceId} for user:`, session.user.id)

      const success = await disconnectUserIntegration(session.user.id, serviceId)

      if (success) {
        await loadIntegrations()
        
        toast({
          title: "Success",
          description: `${availableIntegrations.find(int => int.id === serviceId)?.name} disconnected successfully.`,
        })
      } else {
        throw new Error('Failed to disconnect service')
      }
    } catch (error) {
      console.error('Error disconnecting service:', error)
      toast({
        title: "Error",
        description: "Failed to disconnect service. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDisconnecting(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium">Integrations</h2>
          <p className="text-sm text-muted-foreground">
            Connect external services to enhance your workflow.
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    )
  }

  if (!session?.user?.id) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium">Integrations</h2>
          <p className="text-sm text-muted-foreground">
            Please log in to manage your integrations.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Integrations</h2>
          <p className="text-sm text-muted-foreground">
            Connect external services to enhance your workflow.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connected Services</CardTitle>
          <CardDescription>
            Manage your connected third-party services and applications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {availableIntegrations.map((service) => {
              const Icon = service.icon
              const integration = getIntegrationStatus(service.id)
              const isConnected = Boolean(integration?.is_connected)
              const isConnecting = connecting === service.id
              const isDisconnecting = disconnecting === service.id
              const isProcessing = isConnecting || isDisconnecting
              const isHealthy = isConnected
              
              console.log(`Service ${service.id}: connected=${isConnected}, integration=`, integration)
              
              return (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${service.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{service.name}</h4>
                        {isConnected ? (
                          <Badge variant={isHealthy ? "default" : "secondary"}>
                            {isHealthy ? "Connected" : "Needs Attention"}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Not connected</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {service.description}
                      </p>
                      {isConnected && integration?.connection_data?.connected_at && (
                        <p className="text-xs text-muted-foreground">
                          Connected {new Date(integration.connection_data.connected_at).toLocaleDateString()}
                        </p>
                      )}
                      {integration?.connection_data?.simulated && (
                        <p className="text-xs text-yellow-600">
                          Simulated connection
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(service.id)}
                        disabled={isProcessing}
                      >
                        {isDisconnecting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Unlink className="h-4 w-4 mr-2" />
                        )}
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleConnect(service.id)}
                        disabled={isProcessing}
                      >
                        {isConnecting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>Platform Capabilities</CardTitle>
          <CardDescription>
            Core features and capabilities enabled in your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="font-medium">Artifacts</h4>
                <p className="text-sm text-muted-foreground">
                  Enable creation and execution of code artifacts in the sandbox environment
                </p>
              </div>
              <Switch defaultChecked disabled />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="font-medium">Fragment Templates</h4>
                <p className="text-sm text-muted-foreground">
                  Access to pre-built templates for common development patterns
                </p>
              </div>
              <Switch defaultChecked disabled />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="font-medium">E2B Sandbox</h4>
                <p className="text-sm text-muted-foreground">
                  Cloud-based development environment for running and testing code
                </p>
              </div>
              <Switch defaultChecked disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Access</CardTitle>
          <CardDescription>
            Manage API keys and access tokens for external integrations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Personal Access Token</h4>
              <p className="text-sm text-muted-foreground">
                Generate tokens for API access and automation
              </p>
            </div>
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Manage Tokens
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
