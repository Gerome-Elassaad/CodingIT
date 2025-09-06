import Stripe from 'stripe'

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-08-27.basil',
      typescript: true,
    })
  : null

export const STRIPE_PLANS = {
  free: {
    name: 'Free',
    description: 'Perfect for getting started',
    price: 0,
    priceId: null,
    features: {
      githubImports: 5,
      storageLimit: 100, // MB
      executionTimeLimit: 30, // seconds
      apiCallsPerMonth: 1000,
    },
  },
  pro: {
    name: 'Pro',
    description: 'For serious developers',
    price: 2000, // $9.00 in cents
    priceId: process.env.STRIPE_PRICE_ID_PRO,
    features: {
      githubImports: 50,
      storageLimit: 5000, // MB (5GB)
      executionTimeLimit: 300, // seconds
      apiCallsPerMonth: 50000,
    },
  },
  enterprise: {
    name: 'Enterprise',
    description: 'For teams and organizations',
    price: 10000, // $25.00 in cents
    priceId: process.env.STRIPE_PRICE_ID_ENTERPRISE,
    features: {
      githubImports: -1, // Unlimited
      storageLimit: -1, // Unlimited
      executionTimeLimit: 600, // seconds
      apiCallsPerMonth: -1, // Unlimited
    },
  },
} as const

export type PlanTier = keyof typeof STRIPE_PLANS
export type PlanFeatures = typeof STRIPE_PLANS[PlanTier]['features']

export function getPlanByPriceId(priceId: string): PlanTier | null {
  for (const [planName, plan] of Object.entries(STRIPE_PLANS)) {
    if (plan.priceId === priceId) {
      return planName as PlanTier
    }
  }
  return null
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

export function isFeatureUnlimited(limit: number): boolean {
  return limit === -1
}

export function hasFeatureAccess(
  currentUsage: number,
  limit: number,
  requestedAmount: number = 1
): boolean {
  if (isFeatureUnlimited(limit)) {
    return true
  }
  return currentUsage + requestedAmount <= limit
}
