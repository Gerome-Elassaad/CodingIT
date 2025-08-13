'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { 
  CreditCard, 
  Download, 
  Calendar,
  AlertTriangle,
  Loader2,
  CheckCircle,
  XCircle,
  BarChart3,
  TrendingUp,
  Activity,
  Zap,
  Clock,
  Users,
  Server,
  Database,
  ArrowUp,
  ExternalLink
} from 'lucide-react'
import { useState, useEffect, Suspense } from 'react'
import { useAuth } from '@/lib/auth'
import { useFeatureFlag, useFeatureValue } from '@/hooks/use-edge-flags'
import ErrorBoundary, { SettingsSection } from '@/components/error-boundary'
import { STRIPE_PLANS, formatPrice } from '@/lib/stripe'
import { useSearchParams } from 'next/navigation'
import { API_BASE_URL } from '@/lib/config'

interface BillingData {
  subscription: {
    id: string
    name: string
    tier: string
    subscription_status: string
    current_period_end?: string
    cancel_at_period_end: boolean
    stripe_customer_id?: string
    stripe_subscription_id?: string
  }
  usage_limits: Array<{
    usage_type: string
    limit_value: number
    current_usage: number
    period_end: string
  }>
}

function BillingSettingsContent() {
  const { session, userTeam } = useAuth(() => {}, () => {})
  const { toast } = useToast()
  const searchParams = useSearchParams()
  
  const { enabled: hasAdvancedAnalytics } = useFeatureFlag('advanced-analytics', false)

  const [billingData, setBillingData] = useState<BillingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  // Handle Stripe redirect messages
  useEffect(() => {
    if (!searchParams) return
    
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')
    
    if (success === 'true') {
      toast({
        title: "Subscription Updated!",
        description: "Your subscription has been successfully updated. Changes may take a few minutes to reflect.",
      })
      // Clean URL
      window.history.replaceState({}, '', '/settings/billing')
    }
    
    if (canceled === 'true') {
      toast({
        title: "Upgrade Canceled",
        description: "You can always upgrade later from this page.",
        variant: "default"
      })
      // Clean URL
      window.history.replaceState({}, '', '/settings/billing')
    }
  }, [searchParams, toast])

  useEffect(() => {
    if (!session?.user?.id) return
    
    const loadBillingData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}/api/subscription/usage`)
        if (response.ok) {
          const data = await response.json()
          setBillingData(data)
        } else {
          // Fallback to mock data based on current team tier
          const userTier = userTeam?.tier || 'free'
          const mockData: BillingData = {
            subscription: {
              id: userTeam?.id || '',
              name: userTeam?.name || 'Default Team',
              tier: userTier,
              subscription_status: 'active',
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              cancel_at_period_end: false
            },
            usage_limits: [
              {
                usage_type: 'github_imports',
                limit_value: STRIPE_PLANS[userTier as keyof typeof STRIPE_PLANS].features.githubImports,
                current_usage: 2,
                period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              },
              {
                usage_type: 'storage_mb',
                limit_value: STRIPE_PLANS[userTier as keyof typeof STRIPE_PLANS].features.storageLimit,
                current_usage: 45,
                period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              },
              {
                usage_type: 'api_calls',
                limit_value: STRIPE_PLANS[userTier as keyof typeof STRIPE_PLANS].features.apiCallsPerMonth,
                current_usage: 234,
                period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              }
            ]
          }
          setBillingData(mockData)
        }
      } catch (error) {
        console.error('Error loading billing data:', error)
        toast({
          title: "Error",
          description: "Failed to load billing information.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadBillingData()
  }, [session?.user?.id, userTeam, toast])

  const handleUpgrade = async (planType: string) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/stripe/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType })
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error) {
      console.error('Upgrade error:', error)
      toast({
        title: "Error",
        description: "Failed to start upgrade process.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleManageBilling = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/stripe/portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error) {
      console.error('Portal error:', error)
      toast({
        title: "Error",
        description: "Failed to open billing portal.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const getUsageDisplay = (usageType: string, limit: number, current: number) => {
    const isUnlimited = limit === -1
    const percentage = isUnlimited ? 0 : Math.min(100, (current / limit) * 100)
    
    const typeLabels = {
      github_imports: 'GitHub Imports',
      storage_mb: 'Storage (MB)',
      api_calls: 'API Calls',
      execution_time_seconds: 'Execution Time'
    }

    return (
      <div key={usageType} className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>{typeLabels[usageType as keyof typeof typeLabels]}</span>
          <span>
            {current} / {isUnlimited ? '∞' : limit.toLocaleString()}
          </span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${
              percentage > 80 ? 'bg-destructive' : percentage > 60 ? 'bg-yellow-500' : 'bg-primary'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium">Billing</h2>
          <p className="text-sm text-muted-foreground">
            Manage your subscription and billing information.
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    )
  }

  const currentPlan = STRIPE_PLANS[billingData?.subscription.tier as keyof typeof STRIPE_PLANS] || STRIPE_PLANS.free

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Billing & Subscription</h2>
        <p className="text-sm text-muted-foreground">
          Manage your subscription and view usage limits.
        </p>
      </div>

      {/* Current Plan */}
      <SettingsSection
        title="Current Plan"
        description="Your subscription details and usage limits"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {currentPlan.name} Plan
                  <Badge variant={billingData?.subscription.subscription_status === 'active' ? 'default' : 'destructive'}>
                    {billingData?.subscription.subscription_status || 'active'}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {currentPlan.description}
                  {billingData?.subscription.current_period_end && (
                    <span className="block mt-1">
                      {billingData.subscription.cancel_at_period_end ? 'Cancels' : 'Renews'} on{' '}
                      {new Date(billingData.subscription.current_period_end).toLocaleDateString()}
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {formatPrice(currentPlan.price)}
                  {currentPlan.price > 0 && <span className="text-sm font-normal">/month</span>}
                </div>
                {billingData?.subscription.tier === 'free' ? (
                  <div className="space-x-2 mt-2">
                    <Button onClick={() => handleUpgrade('pro')} disabled={isUpdating}>
                      {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      <ArrowUp className="h-4 w-4 mr-2" />
                      Upgrade to Pro
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" onClick={handleManageBilling} disabled={isUpdating}>
                    {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Manage Billing
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-3">Usage This Month</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {billingData?.usage_limits.map(usage => 
                    getUsageDisplay(usage.usage_type, usage.limit_value, usage.current_usage)
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </SettingsSection>

      {/* Plan Comparison */}
      {billingData?.subscription.tier === 'free' && (
        <SettingsSection
          title="Upgrade Your Plan"
          description="Get more features and higher limits"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(STRIPE_PLANS).map(([key, plan]) => (
              <Card key={key} className={key === 'pro' ? 'border-primary' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    {key === 'pro' && (
                      <Badge>Recommended</Badge>
                    )}
                  </div>
                  <div className="text-2xl font-bold">
                    {formatPrice(plan.price)}
                    {plan.price > 0 && <span className="text-sm font-normal">/month</span>}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      {plan.features.githubImports === -1 ? 'Unlimited' : plan.features.githubImports} GitHub imports
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      {plan.features.storageLimit === -1 ? 'Unlimited' : `${plan.features.storageLimit}MB`} storage
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      {plan.features.apiCallsPerMonth === -1 ? 'Unlimited' : plan.features.apiCallsPerMonth.toLocaleString()} API calls/month
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      {plan.features.executionTimeLimit}s max execution time
                    </li>
                  </ul>
                  <Button 
                    className="w-full mt-4" 
                    variant={key === billingData?.subscription.tier ? 'secondary' : 'default'}
                    disabled={key === billingData?.subscription.tier || key === 'free' || isUpdating}
                    onClick={() => handleUpgrade(key)}
                  >
                    {key === billingData?.subscription.tier ? 'Current Plan' : 
                     key === 'free' ? 'Free Forever' : `Upgrade to ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </SettingsSection>
      )}

      {/* Support */}
      <ErrorBoundary
        fallback={
          <Card className="border-yellow-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="font-medium">Support Unavailable</p>
                  <p className="text-sm text-muted-foreground">
                    Support contact is temporarily unavailable.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        }
      >
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>
              Contact our support team for billing questions or technical assistance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">Billing & Technical Support</p>
                  <p className="text-sm text-muted-foreground">
                    Get help with payments, usage questions, or technical issues
                  </p>
                </div>
              </div>
              <Button variant="outline">
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </ErrorBoundary>
    </div>
  )
}

export default function BillingSettings() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <BillingSettingsContent />
    </Suspense>
  )
}