'use client'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, X, Zap, Star, Crown, Loader2, ArrowUp } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { STRIPE_PLANS, formatPrice } from '@/lib/stripe'
import { API_BASE_URL } from '@/lib/config'

interface UpgradeDialogProps {
  isOpen: boolean
  onClose: () => void
  currentPlan?: string
  featureBlocked?: {
    type: string
    currentUsage: number
    limit: number
  }
  triggerReason?: 'feature_limit' | 'manual_upgrade' | 'onboarding'
}

export function UpgradeDialog({ 
  isOpen, 
  onClose, 
  currentPlan = 'free',
  featureBlocked,
  triggerReason = 'manual_upgrade'
}: UpgradeDialogProps) {
  const [isUpgrading, setIsUpgrading] = useState(false)
  const { toast } = useToast()

  const handleUpgrade = async (planType: string) => {
    setIsUpgrading(true)
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
        description: "Failed to start upgrade process. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpgrading(false)
    }
  }

  const getFeatureMessage = () => {
    const featureNames = {
      github_imports: 'GitHub repository imports',
      storage_mb: 'storage space',
      api_calls: 'API calls',
      execution_time_seconds: 'execution time'
    }

    if (featureBlocked) {
      const featureName = featureNames[featureBlocked.type as keyof typeof featureNames] || 'this feature'
      return `You've reached your ${featureName} limit (${featureBlocked.currentUsage}/${featureBlocked.limit}). Upgrade to continue using premium features.`
    }

    return "Unlock more features and higher limits with a Pro subscription."
  }

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'pro': return <Zap className="h-5 w-5 text-blue-500" />
      case 'enterprise': return <Crown className="h-5 w-5 text-purple-500" />
      default: return <Star className="h-4 w-4 text-gray-500" />
    }
  }

  const getPlanFeatures = (planKey: string) => {
    const plan = STRIPE_PLANS[planKey as keyof typeof STRIPE_PLANS]
    if (!plan) return []

    return [
      `${plan.features.githubImports === -1 ? 'Unlimited' : plan.features.githubImports} GitHub imports per month`,
      `${plan.features.storageLimit === -1 ? 'Unlimited' : plan.features.storageLimit + 'MB'} storage`,
      `${plan.features.apiCallsPerMonth === -1 ? 'Unlimited' : plan.features.apiCallsPerMonth.toLocaleString()} API calls per month`,
      `${plan.features.executionTimeLimit}s maximum execution time`,
      planKey === 'pro' ? 'Priority support' : planKey === 'enterprise' ? 'Dedicated support & custom integrations' : 'Community support'
    ]
  }

  const getRecommendedPlan = () => {
    if (currentPlan === 'free') return 'pro'
    if (currentPlan === 'pro') return 'enterprise'
    return 'pro'
  }

  const recommendedPlan = getRecommendedPlan()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-blue-500" />
              <DialogTitle>
                {triggerReason === 'feature_limit' ? 'Upgrade Required' : 'Upgrade Your Plan'}
              </DialogTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            {getFeatureMessage()}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6">
          {Object.entries(STRIPE_PLANS).filter(([key]) => key !== 'free').map(([key, plan]) => (
            <div 
              key={key} 
              className={`relative border rounded-lg p-6 ${key === recommendedPlan ? 'border-primary bg-primary/5' : 'border-border'}`}
            >
              {key === recommendedPlan && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  Recommended
                </Badge>
              )}
              
              <div className="flex items-center gap-3 mb-4">
                {getPlanIcon(key)}
                <div>
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-3xl font-bold">
                  {formatPrice(plan.price)}
                  <span className="text-lg font-normal text-muted-foreground">/month</span>
                </div>
              </div>

              <ul className="space-y-2 mb-6">
                {getPlanFeatures(key).map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className="w-full" 
                variant={key === recommendedPlan ? 'default' : 'outline'}
                disabled={isUpgrading}
                onClick={() => handleUpgrade(key)}
              >
                {isUpgrading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Upgrade to {plan.name}
              </Button>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex-1 text-center sm:text-left">
            <p className="text-xs text-muted-foreground">
              • Cancel anytime • Secure payments by Stripe • 14-day money-back guarantee
            </p>
          </div>
          <Button variant="ghost" onClick={onClose} disabled={isUpgrading}>
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook to manage upgrade dialog state
export function useUpgradeDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState<{
    currentPlan?: string
    featureBlocked?: UpgradeDialogProps['featureBlocked']
    triggerReason?: UpgradeDialogProps['triggerReason']
  }>({})

  const openUpgradeDialog = (options?: {
    currentPlan?: string
    featureBlocked?: UpgradeDialogProps['featureBlocked']
    triggerReason?: UpgradeDialogProps['triggerReason']
  }) => {
    setConfig(options || {})
    setIsOpen(true)
  }

  const closeUpgradeDialog = () => {
    setIsOpen(false)
    setConfig({})
  }

  return {
    isUpgradeDialogOpen: isOpen,
    openUpgradeDialog,
    closeUpgradeDialog,
    UpgradeDialog: (props: Partial<UpgradeDialogProps>) => (
      <UpgradeDialog
        isOpen={isOpen}
        onClose={closeUpgradeDialog}
        {...config}
        {...props}
      />
    )
  }
}