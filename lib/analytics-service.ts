'use client'

import { usePostHog } from 'posthog-js/react'
import { useAuth } from './auth'
import { useUserTeam } from './user-team-provider'
import { FragmentSchema } from './schema'

export interface AnalyticsUser {
  id: string
  email?: string
  teamId?: string
  tier: string
  signupDate?: string
  isTeamOwner?: boolean
  teamSize?: number
  industry?: string
  role?: string
}

export interface AnalyticsContext {
  sessionId?: string
  projectId?: string
  templateType?: string
  modelProvider?: string
  deviceType?: string
  referrer?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
}

// Core Analytics Service
export class AnalyticsService {
  private static instance: AnalyticsService
  private posthog: any
  private user: AnalyticsUser | null = null
  private context: AnalyticsContext = {}

  private constructor() {}

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService()
    }
    return AnalyticsService.instance
  }

  initialize(posthog: any, user: AnalyticsUser | null) {
    this.posthog = posthog
    this.user = user
    if (user) {
      this.identifyUser(user)
    }
  }

  setContext(context: Partial<AnalyticsContext>) {
    this.context = { ...this.context, ...context }
  }

  private identifyUser(user: AnalyticsUser) {
    if (!this.posthog) return

    this.posthog.identify(user.id, {
      email: user.email,
      teamId: user.teamId,
      tier: user.tier,
      signupDate: user.signupDate,
      isTeamOwner: user.isTeamOwner,
      teamSize: user.teamSize,
      industry: user.industry,
      role: user.role,
    })
  }

  private track(event: string, properties: Record<string, any> = {}) {
    if (!this.posthog) return

    const enrichedProperties = {
      ...properties,
      ...this.context,
      userId: this.user?.id,
      userTier: this.user?.tier,
      teamId: this.user?.teamId,
      timestamp: new Date().toISOString(),
    }

    this.posthog.capture(event, enrichedProperties)
  }

  // User Journey Events
  trackSignup(method: 'email' | 'github', referralCode?: string) {
    this.track('user_signed_up', {
      method,
      referralCode,
      hasReferral: !!referralCode,
    })
  }

  trackSignin(method: 'email' | 'github', isReturning: boolean) {
    this.track('user_signed_in', {
      method,
      isReturning,
      sessionStart: true,
    })
  }

  trackOnboarding(step: string, completed: boolean, timeSpent?: number) {
    this.track('onboarding_step', {
      step,
      completed,
      timeSpent,
      onboardingStage: step,
    })
  }

  // AI Interaction Analytics
  trackChatStart(modelId: string, templateId?: string, hasContext: boolean = false) {
    this.track('chat_started', {
      modelId,
      templateId,
      hasContext,
      chatInitiated: true,
    })
  }

  trackPromptSubmission(
    prompt: string,
    modelId: string,
    promptLength: number,
    hasImages: boolean,
    contextType?: 'none' | 'file' | 'conversation'
  ) {
    this.track('prompt_submitted', {
      modelId,
      promptLength,
      promptWordCount: prompt.split(' ').length,
      hasImages,
      contextType,
      promptComplexity: this.analyzePromptComplexity(prompt),
    })
  }

  trackAIResponse(
    modelId: string,
    responseTime: number,
    tokenCount?: number,
    responseQuality?: 'good' | 'fair' | 'poor'
  ) {
    this.track('ai_response_received', {
      modelId,
      responseTime,
      tokenCount,
      responseQuality,
      responseSpeed: responseTime < 2000 ? 'fast' : responseTime < 5000 ? 'medium' : 'slow',
    })
  }

  trackUserFeedback(
    interactionId: string,
    rating: number,
    feedbackType: 'thumbs_up' | 'thumbs_down' | 'star_rating',
    comment?: string
  ) {
    this.track('user_feedback_given', {
      interactionId,
      rating,
      feedbackType,
      hasComment: !!comment,
      commentLength: comment?.length || 0,
    })
  }

  // Fragment & Code Analytics
  trackFragmentGenerated(
    fragment: FragmentSchema,
    generationTime: number,
    iterationCount: number = 1
  ) {
    this.track('fragment_generated', {
      template: fragment.template,
      hasAdditionalDeps: fragment.has_additional_dependencies,
      depCount: fragment.additional_dependencies?.length || 0,
      codeLength: fragment.code?.length || 0,
      generationTime,
      iterationCount,
      complexity: this.analyzeCodeComplexity(fragment.code || ''),
    })
  }

  trackCodeExecution(
    executionId: string,
    template: string,
    executionTime: number,
    success: boolean,
    errorType?: string,
    resourceUsage?: {
      memory?: number
      cpu?: number
    }
  ) {
    this.track('code_executed', {
      executionId,
      template,
      executionTime,
      success,
      errorType,
      memoryUsage: resourceUsage?.memory,
      cpuUsage: resourceUsage?.cpu,
      executionSpeed: executionTime < 1000 ? 'fast' : executionTime < 5000 ? 'medium' : 'slow',
    })
  }

  trackSandboxCreation(template: string, creationTime: number, success: boolean) {
    this.track('sandbox_created', {
      template,
      creationTime,
      success,
      creationSpeed: creationTime < 3000 ? 'fast' : creationTime < 8000 ? 'medium' : 'slow',
    })
  }

  // Feature Usage Analytics
  trackFeatureUsed(
    feature: string,
    context?: Record<string, any>,
    usageFrequency?: 'first_time' | 'occasional' | 'frequent'
  ) {
    this.track('feature_used', {
      feature,
      usageFrequency,
      ...context,
    })
  }

  trackTemplateSelected(
    templateId: string,
    selectionMethod: 'manual' | 'auto',
    previousTemplate?: string
  ) {
    this.track('template_selected', {
      templateId,
      selectionMethod,
      previousTemplate,
      templateSwitch: !!previousTemplate && previousTemplate !== templateId,
    })
  }

  trackModelSwitch(
    fromModel: string,
    toModel: string,
    reason: 'performance' | 'feature' | 'cost' | 'experiment' | 'other'
  ) {
    this.track('model_switched', {
      fromModel,
      toModel,
      reason,
      providerSwitch: this.extractProvider(fromModel) !== this.extractProvider(toModel),
    })
  }

  // Business & Conversion Analytics
  trackSubscriptionUpgrade(
    fromTier: string,
    toTier: string,
    reason?: string,
    annualDiscount?: boolean
  ) {
    this.track('subscription_upgraded', {
      fromTier,
      toTier,
      reason,
      annualDiscount,
      upgradeValue: this.calculateUpgradeValue(fromTier, toTier),
      conversionEvent: true,
    })
  }

  trackTrialConversion(trialDays: number, convertedToPlan: string) {
    this.track('trial_converted', {
      trialDays,
      convertedToPlan,
      conversionRate: 1,
      trialSuccess: true,
    })
  }

  trackPaymentFailure(reason: string, amount?: number, plan?: string) {
    this.track('payment_failed', {
      reason,
      amount,
      plan,
      churnRisk: true,
    })
  }

  trackUsageLimitHit(
    limitType: 'api_calls' | 'execution_time' | 'storage' | 'github_imports',
    currentUsage: number,
    limit: number,
    tier: string
  ) {
    this.track('usage_limit_reached', {
      limitType,
      currentUsage,
      limit,
      tier,
      utilizationRate: (currentUsage / limit) * 100,
      upsellOpportunity: true,
    })
  }

  // Team Collaboration Analytics
  trackTeamInvite(role: string, teamSize: number) {
    this.track('team_member_invited', {
      role,
      teamSize,
      teamGrowth: true,
    })
  }

  trackCollaborativeEdit(
    projectId: string,
    collaborators: number,
    editType: 'code' | 'comment' | 'fragment'
  ) {
    this.track('collaborative_edit', {
      projectId,
      collaborators,
      editType,
      realTimeCollaboration: true,
    })
  }

  // Integration Analytics
  trackGitHubIntegration(action: 'connect' | 'import' | 'sync', repoCount?: number) {
    this.track('github_integration', {
      action,
      repoCount,
      integrationType: 'github',
    })
  }

  trackAPIUsage(endpoint: string, responseTime: number, statusCode: number) {
    this.track('api_call_made', {
      endpoint,
      responseTime,
      statusCode,
      success: statusCode < 400,
      apiUsage: true,
    })
  }

  // Session Analytics
  trackSessionEnd(
    sessionDuration: number,
    fragmentsGenerated: number,
    messagesExchanged: number,
    errorsEncountered: number
  ) {
    this.track('session_ended', {
      sessionDuration,
      fragmentsGenerated,
      messagesExchanged,
      errorsEncountered,
      productivity: fragmentsGenerated / (sessionDuration / 1000 / 60), // fragments per minute
      sessionQuality: errorsEncountered < 3 ? 'good' : 'poor',
    })
  }

  // Helper Methods
  private analyzePromptComplexity(prompt: string): 'simple' | 'medium' | 'complex' {
    const wordCount = prompt.split(' ').length
    const hasCodeBlocks = /```/.test(prompt)
    const hasMultipleRequests = prompt.split('.').length > 3
    
    if (wordCount > 100 || hasCodeBlocks || hasMultipleRequests) return 'complex'
    if (wordCount > 30) return 'medium'
    return 'simple'
  }

  private analyzeCodeComplexity(code: string): 'simple' | 'medium' | 'complex' {
    const lines = code.split('\n').length
    const hasClasses = /class\s+\w+/.test(code)
    const hasFunctions = /function\s+\w+|def\s+\w+/.test(code)
    const hasImports = /import\s+|from\s+.*import/.test(code)
    
    if (lines > 50 || (hasClasses && hasFunctions && hasImports)) return 'complex'
    if (lines > 15 || hasFunctions) return 'medium'
    return 'simple'
  }

  private extractProvider(modelId: string): string {
    if (modelId.includes('gpt') || modelId.includes('openai')) return 'openai'
    if (modelId.includes('claude')) return 'anthropic'
    if (modelId.includes('gemini') || modelId.includes('palm')) return 'google'
    if (modelId.includes('mistral')) return 'mistral'
    return 'other'
  }

  private calculateUpgradeValue(fromTier: string, toTier: string): number {
    const tierValues = { free: 0, pro: 20, enterprise: 100 }
    return (tierValues[toTier as keyof typeof tierValues] || 0) - 
           (tierValues[fromTier as keyof typeof tierValues] || 0)
  }
}

// React Hook for Easy Usage
export function useAnalytics() {
  const posthog = usePostHog()
  const { session } = useAuth(() => {}, () => {})
  const { userTeam } = useUserTeam()
  const analytics = AnalyticsService.getInstance()

  // Initialize analytics service
  React.useEffect(() => {
    if (posthog && session) {
      const user: AnalyticsUser = {
        id: session.user.id,
        email: session.user.email,
        teamId: userTeam?.id,
        tier: userTeam?.tier || 'free',
        signupDate: session.user.created_at,
        // Additional user properties can be added here
      }
      analytics.initialize(posthog, user)
    }
  }, [posthog, session, userTeam, analytics])

  return analytics
}

// Import React for the useEffect hook
import React from 'react'
