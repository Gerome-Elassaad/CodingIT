export interface BaseEventProperties {
  userId?: string
  teamId?: string
  userTier?: string
  sessionId?: string
  timestamp?: string
  deviceType?: string
  browser?: string
  referrer?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
}

// User Lifecycle Events
export interface UserSignedUpEvent extends BaseEventProperties {
  method: 'email' | 'github'
  referralCode?: string
  hasReferral: boolean
  signupFlow: 'direct' | 'referral' | 'organic'
}

export interface UserSignedInEvent extends BaseEventProperties {
  method: 'email' | 'github'
  isReturning: boolean
  sessionStart: boolean
  daysSinceLastLogin?: number
}

export interface OnboardingStepEvent extends BaseEventProperties {
  step: string
  completed: boolean
  timeSpent?: number
  onboardingStage: string
  stepIndex: number
  totalSteps: number
}

// AI Interaction Events
export interface ChatStartedEvent extends BaseEventProperties {
  modelId: string
  templateId?: string
  hasContext: boolean
  chatInitiated: boolean
  conversationType: 'new' | 'continuation'
}

export interface PromptSubmittedEvent extends BaseEventProperties {
  modelId: string
  promptLength: number
  promptWordCount: number
  hasImages: boolean
  contextType?: 'none' | 'file' | 'conversation'
  promptComplexity: 'simple' | 'medium' | 'complex'
  promptCategory?: 'code_generation' | 'debugging' | 'explanation' | 'refactoring' | 'other'
}

export interface AIResponseReceivedEvent extends BaseEventProperties {
  modelId: string
  responseTime: number
  tokenCount?: number
  responseQuality?: 'good' | 'fair' | 'poor'
  responseSpeed: 'fast' | 'medium' | 'slow'
  responseType: 'fragment' | 'text' | 'error'
}

export interface UserFeedbackGivenEvent extends BaseEventProperties {
  interactionId: string
  rating: number
  feedbackType: 'thumbs_up' | 'thumbs_down' | 'star_rating'
  hasComment: boolean
  commentLength: number
  feedbackContext: 'response_quality' | 'code_accuracy' | 'performance' | 'general'
}

// Code Generation & Execution Events
export interface FragmentGeneratedEvent extends BaseEventProperties {
  template: string
  hasAdditionalDeps: boolean
  depCount: number
  codeLength: number
  generationTime: number
  iterationCount: number
  complexity: 'simple' | 'medium' | 'complex'
  language: string
  framework?: string
}

export interface CodeExecutedEvent extends BaseEventProperties {
  executionId: string
  template: string
  executionTime: number
  success: boolean
  errorType?: string
  memoryUsage?: number
  cpuUsage?: number
  executionSpeed: 'fast' | 'medium' | 'slow'
  outputSize?: number
  hasVisualOutput: boolean
}

export interface SandboxCreatedEvent extends BaseEventProperties {
  template: string
  creationTime: number
  success: boolean
  creationSpeed: 'fast' | 'medium' | 'slow'
  resourcesAllocated?: {
    memory: number
    cpu: number
    storage: number
  }
}

// Feature Usage Events  
export interface FeatureUsedEvent extends BaseEventProperties {
  feature: string
  usageFrequency?: 'first_time' | 'occasional' | 'frequent'
  featureCategory: 'core' | 'premium' | 'integration' | 'collaboration'
  context?: Record<string, any>
}

export interface TemplateSelectedEvent extends BaseEventProperties {
  templateId: string
  selectionMethod: 'manual' | 'auto'
  previousTemplate?: string
  templateSwitch: boolean
  templateCategory: 'web' | 'data' | 'ml' | 'mobile' | 'other'
}

export interface ModelSwitchedEvent extends BaseEventProperties {
  fromModel: string
  toModel: string
  reason: 'performance' | 'feature' | 'cost' | 'experiment' | 'other'
  providerSwitch: boolean
  modelTier: 'free' | 'premium'
}

// Business & Revenue Events
export interface SubscriptionUpgradedEvent extends BaseEventProperties {
  fromTier: string
  toTier: string
  reason?: string
  annualDiscount?: boolean
  upgradeValue: number
  conversionEvent: true
  upgradeMethod: 'self_serve' | 'sales_assisted'
  trialDaysRemaining?: number
}

export interface TrialConvertedEvent extends BaseEventProperties {
  trialDays: number
  convertedToPlan: string
  conversionRate: number
  trialSuccess: true
  featuresUsedDuringTrial: string[]
  conversionTrigger: 'limit_reached' | 'trial_expiry' | 'feature_locked' | 'voluntary'
}

export interface PaymentFailedEvent extends BaseEventProperties {
  reason: string
  amount?: number
  plan?: string
  churnRisk: true
  failureCount: number
  paymentMethod: string
}

export interface UsageLimitReachedEvent extends BaseEventProperties {
  limitType: 'api_calls' | 'execution_time' | 'storage' | 'github_imports'
  currentUsage: number
  limit: number
  tier: string
  utilizationRate: number
  upsellOpportunity: true
  limitHitDate: string
  daysInPeriod: number
}

// Team Collaboration Events
export interface TeamMemberInvitedEvent extends BaseEventProperties {
  role: string
  teamSize: number
  teamGrowth: true
  inviteMethod: 'email' | 'link' | 'bulk_import'
  organizationSize: 'small' | 'medium' | 'large' | 'enterprise'
}

export interface CollaborativeEditEvent extends BaseEventProperties {
  projectId: string
  collaborators: number
  editType: 'code' | 'comment' | 'fragment'
  realTimeCollaboration: true
  conflictResolution?: boolean
  editDuration: number
}

export interface ProjectSharedEvent extends BaseEventProperties {
  projectId: string
  shareMethod: 'link' | 'email' | 'team'
  recipientCount: number
  sharePermissions: 'view' | 'edit' | 'admin'
  projectType: string
}

// Integration Events
export interface GitHubIntegrationEvent extends BaseEventProperties {
  action: 'connect' | 'import' | 'sync' | 'deploy'
  repoCount?: number
  integrationType: 'github'
  repositorySize?: 'small' | 'medium' | 'large'
  organizationType: 'personal' | 'organization'
}

export interface APICallMadeEvent extends BaseEventProperties {
  endpoint: string
  responseTime: number
  statusCode: number
  success: boolean
  apiUsage: true
  requestSize?: number
  responseSize?: number
  rateLimitHit?: boolean
}

export interface WebhookReceivedEvent extends BaseEventProperties {
  webhookType: 'github' | 'stripe' | 'custom'
  eventType: string
  success: boolean
  processingTime: number
  retryCount?: number
}

// Session Analytics Events
export interface SessionEndedEvent extends BaseEventProperties {
  sessionDuration: number
  fragmentsGenerated: number
  messagesExchanged: number
  errorsEncountered: number
  productivity: number // fragments per minute
  sessionQuality: 'good' | 'poor'
  uniqueModelsUsed: number
  uniqueTemplatesUsed: number
}

export interface PageViewEvent extends BaseEventProperties {
  page: string
  pageCategory: 'auth' | 'dashboard' | 'settings' | 'chat' | 'analytics'
  viewDuration?: number
  exitPage: boolean
  bounceRate?: number
}

// Error & Performance Events
export interface ErrorOccurredEvent extends BaseEventProperties {
  errorType: 'system' | 'user' | 'network' | 'ai_model'
  errorCode?: string
  errorMessage?: string
  errorContext: string
  recoverable: boolean
  userImpact: 'low' | 'medium' | 'high'
}

export interface PerformanceMetricEvent extends BaseEventProperties {
  metricType: 'load_time' | 'response_time' | 'render_time'
  value: number
  threshold: number
  isWithinThreshold: boolean
  pageOrFeature: string
}

// Data Export & Analytics Events
export interface DataExportedEvent extends BaseEventProperties {
  exportType: 'csv' | 'json' | 'pdf'
  dataType: 'chat_history' | 'analytics' | 'usage' | 'projects'
  recordCount: number
  fileSizeMB: number
  exportDuration: number
}

export interface AnalyticsDashboardViewedEvent extends BaseEventProperties {
  dashboardType: 'user' | 'team' | 'admin'
  metricsViewed: string[]
  timeRange: '1d' | '7d' | '30d' | '90d' | '1y'
  exportRequested: boolean
}

// Custom Business Intelligence Events
export interface ProductivityMeasuredEvent extends BaseEventProperties {
  timeToFirstFragment: number
  averageIterationsPerFragment: number
  successRate: number
  codeQualityScore?: number
  developmentVelocity: number
  toolSwitchingFrequency: number
}

export interface ChurnRiskCalculatedEvent extends BaseEventProperties {
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  factors: string[]
  daysSinceLastActivity: number
  usageDecline: number
  supportTickets: number
}

// Union type of all possible events for type safety
export type AnalyticsEvent =
  | UserSignedUpEvent
  | UserSignedInEvent
  | OnboardingStepEvent
  | ChatStartedEvent
  | PromptSubmittedEvent
  | AIResponseReceivedEvent
  | UserFeedbackGivenEvent
  | FragmentGeneratedEvent
  | CodeExecutedEvent
  | SandboxCreatedEvent
  | FeatureUsedEvent
  | TemplateSelectedEvent
  | ModelSwitchedEvent
  | SubscriptionUpgradedEvent
  | TrialConvertedEvent
  | PaymentFailedEvent
  | UsageLimitReachedEvent
  | TeamMemberInvitedEvent
  | CollaborativeEditEvent
  | ProjectSharedEvent
  | GitHubIntegrationEvent
  | APICallMadeEvent
  | WebhookReceivedEvent
  | SessionEndedEvent
  | PageViewEvent
  | ErrorOccurredEvent
  | PerformanceMetricEvent
  | DataExportedEvent
  | AnalyticsDashboardViewedEvent
  | ProductivityMeasuredEvent
  | ChurnRiskCalculatedEvent

// Event Categories for Business Intelligence
export const EVENT_CATEGORIES = {
  USER_LIFECYCLE: [
    'user_signed_up',
    'user_signed_in',
    'onboarding_step',
  ],
  AI_INTERACTION: [
    'chat_started',
    'prompt_submitted',
    'ai_response_received',
    'user_feedback_given',
  ],
  CODE_DEVELOPMENT: [
    'fragment_generated',
    'code_executed',
    'sandbox_created',
  ],
  FEATURE_USAGE: [
    'feature_used',
    'template_selected',
    'model_switched',
  ],
  REVENUE: [
    'subscription_upgraded',
    'trial_converted',
    'payment_failed',
    'usage_limit_reached',
  ],
  COLLABORATION: [
    'team_member_invited',
    'collaborative_edit',
    'project_shared',
  ],
  INTEGRATIONS: [
    'github_integration',
    'api_call_made',
    'webhook_received',
  ],
  ENGAGEMENT: [
    'session_ended',
    'page_view',
  ],
  SYSTEM: [
    'error_occurred',
    'performance_metric',
  ],
  BUSINESS_INTELLIGENCE: [
    'data_exported',
    'analytics_dashboard_viewed',
    'productivity_measured',
    'churn_risk_calculated',
  ],
} as const

// Revenue-related events for monetization focus
export const REVENUE_EVENTS = [
  'subscription_upgraded',
  'trial_converted',
  'usage_limit_reached',
  'payment_failed',
  'feature_used',
  'model_switched',
  'github_integration',
] as const

// High-value data events for external sales
export const MONETIZABLE_EVENTS = [
  'fragment_generated',
  'model_switched',
  'template_selected',
  'productivity_measured',
  'ai_response_received',
  'code_executed',
  'collaboration_edit',
  'github_integration',
] as const