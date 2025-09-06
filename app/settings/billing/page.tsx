'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { 
  AlertTriangle,
  Loader2,
  CheckCircle,
  ArrowUp,
  ExternalLink
} from 'lucide-react'
import { useState, useEffect, Suspense } from 'react'
import { useAuthContext } from '@/lib/auth-provider'
import { useUserTeam } from '@/lib/user-team-provider'
import ErrorBoundary, { SettingsSection } from '@/components/error-boundary'
import { STRIPE_PLANS, formatPrice } from '@/lib/stripe'
import { useSearchParams } from 'next/navigation'
import { BillingForm } from '@/components/billing-form'

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
  const { session } = useAuthContext()
  const { userTeam } = useUserTeam()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  
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
        const response = await fetch('/api/subscription/usage')
        if (!response.ok) {
          throw new Error('Failed to fetch billing data')
        }
        const data = await response.json()
        setBillingData(data)
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
      const response = await fetch('/api/stripe/checkout', {
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


  const handleBillingFormSubmit = async (data: any) => {
    try {
      const response = await fetch('/api/stripe/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update billing information')
      }

      const result = await response.json()
      console.log('Billing information updated:', result)
    } catch (error) {
      console.error('Error updating billing info:', error)
      throw error
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
                {billingData?.subscription.tier === 'free' && (
                  <div className="space-x-2 mt-2">
                    <Button onClick={() => handleUpgrade('pro')} disabled={isUpdating}>
                      {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      <ArrowUp className="h-4 w-4 mr-2" />
                      Upgrade to Pro
                    </Button>
                  </div>
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


      {/* Manage Subscription */}
      <SettingsSection
        title="Manage Subscription"
        description="Change your plan or update billing details"
      >
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Upgrade to Pro</p>
                  <p className="text-sm text-muted-foreground">
                    Unlock more features and higher limits.
                  </p>
                </div>
                <Button 
                  onClick={() => handleUpgrade('pro')} 
                  disabled={isUpdating || billingData?.subscription.tier === 'pro'}
                >
                  {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Upgrade to Pro
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Upgrade to Enterprise</p>
                  <p className="text-sm text-muted-foreground">
                    For teams and organizations with advanced needs.
                  </p>
                </div>
                <Button 
                  onClick={() => handleUpgrade('enterprise')} 
                  disabled={isUpdating || billingData?.subscription.tier === 'enterprise'}
                >
                  {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Upgrade to Enterprise
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </SettingsSection>

      {/* Billing Information Form */}
      <SettingsSection
        title="Billing Details"
        description="Update your billing information and payment preferences"
      >
        <BillingForm
          onSubmit={handleBillingFormSubmit}
          isLoading={isLoading}
        />
      </SettingsSection>

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
