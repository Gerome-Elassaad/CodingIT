import { supabase } from './supabase-client'

// Advanced User Segmentation and Behavioral Classification
// This system creates valuable data segments for monetization and product development

export interface UserSegment {
  segmentId: string
  segmentName: string
  description: string
  criteria: SegmentationCriteria
  userCount: number
  revenueContribution: number
  averageLifetimeValue: number
  churnRate: number
  conversionRate: number
}

export interface SegmentationCriteria {
  behavioralTraits: string[]
  usagePatterns: string[]
  demographicFilters: Record<string, any>
  valueThresholds: Record<string, number>
  timeBasedFilters: Record<string, string>
}

export interface UserProfile {
  userId: string
  teamId: string
  segments: string[]
  behaviorScore: BehaviorScore
  usageProfile: UsageProfile
  valueProfile: ValueProfile
  riskProfile: RiskProfile
  recommendations: string[]
  lastUpdated: string
}

export interface BehaviorScore {
  engagementScore: number // 0-100
  adoptionScore: number // 0-100  
  collaborationScore: number // 0-100
  innovationScore: number // 0-100
  loyaltyScore: number // 0-100
  overallScore: number // 0-100
}

export interface UsageProfile {
  dailyActiveUse: boolean
  weeklyActiveUse: boolean
  monthlyActiveUse: boolean
  averageSessionDuration: number
  featuresUsed: string[]
  preferredModels: string[]
  preferredTemplates: string[]
  codeComplexityPreference: 'simple' | 'medium' | 'complex'
  collaborationLevel: 'individual' | 'small_team' | 'large_team'
}

export interface ValueProfile {
  currentTier: string
  monthlySpend: number
  lifetimeValue: number
  upsellPotential: number
  pricesensitivity: 'low' | 'medium' | 'high'
  featureValuePerception: Record<string, number>
  priceSettings?: 'low' | 'medium' | 'high'
}

export interface RiskProfile {
  churnRisk: 'low' | 'medium' | 'high' | 'critical'
  churnIndicators: string[]
  retentionScore: number
  supportTicketCount: number
  usageDeclineRate: number
  competitorRisk: number
}

export class UserSegmentationService {
  private static instance: UserSegmentationService
  private supabase = supabase

  private constructor() {}

  static getInstance(): UserSegmentationService {
    if (!UserSegmentationService.instance) {
      UserSegmentationService.instance = new UserSegmentationService()
    }
    return UserSegmentationService.instance
  }

  // Predefined valuable segments for business intelligence
  private getBusinessSegments(): UserSegment[] {
    return [
      {
        segmentId: 'power_users',
        segmentName: 'Power Users',
        description: 'Heavy users with high engagement and feature adoption',
        criteria: {
          behavioralTraits: ['high_engagement', 'feature_explorer', 'frequent_user'],
          usagePatterns: ['daily_active', 'complex_projects', 'multiple_templates'],
          demographicFilters: {},
          valueThresholds: { engagementScore: 80, monthlyFragments: 100 },
          timeBasedFilters: { activeDays: '>=25' }
        },
        userCount: 0,
        revenueContribution: 0,
        averageLifetimeValue: 450,
        churnRate: 5,
        conversionRate: 85
      },
      {
        segmentId: 'enterprise_prospects',
        segmentName: 'Enterprise Prospects',
        description: 'Users showing enterprise-level usage patterns and collaboration',
        criteria: {
          behavioralTraits: ['team_leader', 'integration_heavy', 'collaboration_focused'],
          usagePatterns: ['team_collaboration', 'github_integration', 'advanced_features'],
          demographicFilters: { teamSize: '>=5' },
          valueThresholds: { collaborationScore: 70, integrationUsage: 10 },
          timeBasedFilters: { tenure: '>=3_months' }
        },
        userCount: 0,
        revenueContribution: 0,
        averageLifetimeValue: 1200,
        churnRate: 8,
        conversionRate: 75
      },
      {
        segmentId: 'trial_converters',
        segmentName: 'Trial Converters',
        description: 'Free users with high conversion potential',
        criteria: {
          behavioralTraits: ['goal_oriented', 'feature_seeker', 'limit_testing'],
          usagePatterns: ['approaching_limits', 'premium_feature_attempts', 'regular_usage'],
          demographicFilters: { tier: 'free' },
          valueThresholds: { engagementScore: 60, usageLimitHits: 3 },
          timeBasedFilters: { signupDate: '>=14_days' }
        },
        userCount: 0,
        revenueContribution: 0,
        averageLifetimeValue: 240,
        churnRate: 15,
        conversionRate: 45
      },
      {
        segmentId: 'churn_risk',
        segmentName: 'Churn Risk',
        description: 'Users at high risk of churning',
        criteria: {
          behavioralTraits: ['declining_usage', 'support_heavy', 'frustrated'],
          usagePatterns: ['irregular_usage', 'error_prone', 'basic_features_only'],
          demographicFilters: {},
          valueThresholds: { engagementScore: 30, usageDecline: 50 },
          timeBasedFilters: { lastActive: '>=7_days' }
        },
        userCount: 0,
        revenueContribution: 0,
        averageLifetimeValue: 150,
        churnRate: 65,
        conversionRate: 10
      },
      {
        segmentId: 'ai_enthusiasts',
        segmentName: 'AI Enthusiasts',
        description: 'Users experimenting with multiple AI models and advanced features',
        criteria: {
          behavioralTraits: ['model_experimenter', 'early_adopter', 'tech_savvy'],
          usagePatterns: ['model_switching', 'advanced_prompting', 'beta_features'],
          demographicFilters: {},
          valueThresholds: { modelDiversity: 5, innovationScore: 70 },
          timeBasedFilters: {}
        },
        userCount: 0,
        revenueContribution: 0,
        averageLifetimeValue: 380,
        churnRate: 12,
        conversionRate: 65
      },
      {
        segmentId: 'developer_teams',
        segmentName: 'Developer Teams',
        description: 'Professional development teams using CodinIT for production work',
        criteria: {
          behavioralTraits: ['production_focused', 'quality_driven', 'workflow_integrated'],
          usagePatterns: ['github_workflows', 'code_review', 'deployment_integration'],
          demographicFilters: { industry: 'software_development' },
          valueThresholds: { codeQuality: 80, githubIntegrations: 3 },
          timeBasedFilters: {}
        },
        userCount: 0,
        revenueContribution: 0,
        averageLifetimeValue: 850,
        churnRate: 6,
        conversionRate: 80
      },
      {
        segmentId: 'learners',
        segmentName: 'Learners & Students',
        description: 'Users primarily using CodinIT for learning and educational purposes',
        criteria: {
          behavioralTraits: ['learning_focused', 'tutorial_heavy', 'beginner_friendly'],
          usagePatterns: ['educational_templates', 'simple_projects', 'help_seeking'],
          demographicFilters: { role: 'student' },
          valueThresholds: { helpUsage: 10 },
          timeBasedFilters: {}
        },
        userCount: 0,
        revenueContribution: 0,
        averageLifetimeValue: 120,
        churnRate: 25,
        conversionRate: 20
      },
      {
        segmentId: 'content_creators',
        segmentName: 'Content Creators',
        description: 'Users creating educational content, tutorials, or demonstrations',
        criteria: {
          behavioralTraits: ['sharing_focused', 'demo_creator', 'teaching_oriented'],
          usagePatterns: ['project_sharing', 'demo_creation', 'export_heavy'],
          demographicFilters: {},
          valueThresholds: { sharingActivity: 10, exportCount: 20 },
          timeBasedFilters: {}
        },
        userCount: 0,
        revenueContribution: 0,
        averageLifetimeValue: 280,
        churnRate: 18,
        conversionRate: 35
      }
    ]
  }

  // Calculate user behavior scores
  async calculateBehaviorScore(userId: string, timeRangeMonths: number = 3): Promise<BehaviorScore> {
    try {
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - timeRangeMonths)

      // Get user activity data
      const { data: activities } = await this.supabase
        .from('revenue_attributions')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())

      if (!activities || activities.length === 0) {
        return {
          engagementScore: 10,
          adoptionScore: 10,
          collaborationScore: 0,
          innovationScore: 10,
          loyaltyScore: 50,
          overallScore: 16
        }
      }

      // Calculate engagement score (frequency and recency of usage)
      const daysSinceLastActivity = Math.floor(
        (Date.now() - new Date(Math.max(...activities.map((a: any) => new Date(a.created_at).getTime()))).getTime()) / (1000 * 60 * 60 * 24)
      )
      const activityFrequency = activities.length / (timeRangeMonths * 30)
      const engagementScore = Math.min(100, Math.max(0, 
        (100 - daysSinceLastActivity * 2) * 0.6 + Math.min(100, activityFrequency * 10) * 0.4
      ))

      // Calculate adoption score (diversity of features used)
      const uniqueEventTypes = new Set(activities.map((a: any) => a.event_type))
      const featureUsageEvents = activities.filter((a: any) => a.event_type === 'feature_used')
      const uniqueFeatures = new Set(featureUsageEvents.map((a: any) => a.event_properties?.feature))
      const adoptionScore = Math.min(100, (uniqueEventTypes.size * 10) + (uniqueFeatures.size * 5))

      // Calculate collaboration score (team-related activities)
      const collaborationEvents = activities.filter((a: any) => 
        ['team_member_invited', 'collaborative_edit', 'project_shared'].includes(a.event_type)
      )
      const collaborationScore = Math.min(100, collaborationEvents.length * 15)

      // Calculate innovation score (advanced features, model experimentation)
      const innovationEvents = activities.filter((a: any) => 
        ['model_switched', 'github_integration', 'advanced_feature_used'].includes(a.event_type)
      )
      const complexFragments = activities.filter((a: any) => 
        a.event_type === 'fragment_generated' && a.event_properties?.complexity === 'complex'
      )
      const innovationScore = Math.min(100, (innovationEvents.length * 8) + (complexFragments.length * 12))

      // Calculate loyalty score (consistent usage over time, positive feedback)
      const positiveEvents = activities.filter((a: any) => a.revenue_impact > 0)
      const negativeEvents = activities.filter((a: any) => a.revenue_impact < 0)
      const feedbackEvents = activities.filter((a: any) => a.event_type === 'user_feedback_given')
      const positiveFeedback = feedbackEvents.filter((a: any) => (a.event_properties?.rating || 0) >= 4)
      
      const loyaltyScore = Math.min(100, Math.max(0,
        (positiveEvents.length / Math.max(1, activities.length)) * 60 +
        (positiveFeedback.length / Math.max(1, feedbackEvents.length)) * 40 -
        (negativeEvents.length * 5)
      ))

      // Overall score (weighted average)
      const overallScore = Math.round(
        engagementScore * 0.3 +
        adoptionScore * 0.25 +
        collaborationScore * 0.15 +
        innovationScore * 0.15 +
        loyaltyScore * 0.15
      )

      return {
        engagementScore: Math.round(engagementScore),
        adoptionScore: Math.round(adoptionScore),
        collaborationScore: Math.round(collaborationScore),
        innovationScore: Math.round(innovationScore),
        loyaltyScore: Math.round(loyaltyScore),
        overallScore
      }

    } catch (error) {
      console.error('Error calculating behavior score:', error)
      return {
        engagementScore: 0,
        adoptionScore: 0,
        collaborationScore: 0,
        innovationScore: 0,
        loyaltyScore: 0,
        overallScore: 0
      }
    }
  }

  // Generate comprehensive user profile
  async generateUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      // Get user and team information
      const { data: userTeam } = await this.supabase
        .from('users_teams')
        .select(`
          user_id,
          users!inner(email, created_at),
          teams!inner(id, tier, name)
        `)
        .eq('user_id', userId)
        .eq('is_default', true)
        .single()

      if (!userTeam) return null

      const teamId = (userTeam.teams as any).id
      const userTier = (userTeam.teams as any).tier || 'free'
      const signupDate = new Date((userTeam.users as any).created_at)

      // Calculate behavior scores
      const behaviorScore = await this.calculateBehaviorScore(userId)

      // Get usage profile
      const usageProfile = await this.calculateUsageProfile(userId)

      // Get value profile  
      const valueProfile = await this.calculateValueProfile(userId, teamId, userTier)

      // Calculate risk profile
      const riskProfile = await this.calculateRiskProfile(userId, behaviorScore)

      // Determine user segments
      const segments = await this.assignUserSegments(userId, behaviorScore, usageProfile, valueProfile, riskProfile)

      // Generate personalized recommendations
      const recommendations = this.generateRecommendations(behaviorScore, usageProfile, valueProfile, riskProfile)

      return {
        userId,
        teamId,
        segments,
        behaviorScore,
        usageProfile,
        valueProfile,
        riskProfile,
        recommendations,
        lastUpdated: new Date().toISOString()
      }

    } catch (error) {
      console.error('Error generating user profile:', error)
      return null
    }
  }

  // Calculate usage profile
  private async calculateUsageProfile(userId: string): Promise<UsageProfile> {
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: recentActivity } = await this.supabase
        .from('revenue_attributions')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString())

      if (!recentActivity) {
        return {
          dailyActiveUse: false,
          weeklyActiveUse: false,
          monthlyActiveUse: false,
          averageSessionDuration: 0,
          featuresUsed: [],
          preferredModels: [],
          preferredTemplates: [],
          codeComplexityPreference: 'simple',
          collaborationLevel: 'individual'
        }
      }

      // Check activity levels
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

      const dailyActiveUse = recentActivity.some((a: any) => new Date(a.created_at) >= oneDayAgo)
      const weeklyActiveUse = recentActivity.some((a: any) => new Date(a.created_at) >= sevenDaysAgo)
      const monthlyActiveUse = recentActivity.length > 0

      // Extract preferences
      const modelEvents = recentActivity.filter((a: any) => a.event_type === 'model_switched')
      const templateEvents = recentActivity.filter((a: any) => a.event_type === 'template_selected')
      const fragmentEvents = recentActivity.filter((a: any) => a.event_type === 'fragment_generated')
      const featureEvents = recentActivity.filter((a: any) => a.event_type === 'feature_used')
      const collaborationEvents = recentActivity.filter((a: any) => 
        ['team_member_invited', 'collaborative_edit', 'project_shared'].includes(a.event_type)
      )

      // Get most used models and templates
      const modelCounts: Record<string, number> = {}
      modelEvents.forEach((e: any) => {
        const model = e.event_properties?.toModel
        if (model) modelCounts[model] = (modelCounts[model] || 0) + 1
      })

      const templateCounts: Record<string, number> = {}
      templateEvents.forEach((e: any) => {
        const template = e.event_properties?.templateId
        if (template) templateCounts[template] = (templateCounts[template] || 0) + 1
      })

      const preferredModels = Object.entries(modelCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([model]) => model)

      const preferredTemplates = Object.entries(templateCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([template]) => template)

      // Determine code complexity preference
      const complexityScores = fragmentEvents.map((e: any) => e.event_properties?.complexity)
      const complexCount = complexityScores.filter((c: any) => c === 'complex').length
      const mediumCount = complexityScores.filter((c: any) => c === 'medium').length
      const simpleCount = complexityScores.filter((c: any) => c === 'simple').length

      let codeComplexityPreference: 'simple' | 'medium' | 'complex' = 'simple'
      if (complexCount > mediumCount && complexCount > simpleCount) {
        codeComplexityPreference = 'complex'
      } else if (mediumCount > simpleCount) {
        codeComplexityPreference = 'medium'
      }

      // Determine collaboration level
      let collaborationLevel: 'individual' | 'small_team' | 'large_team' = 'individual'
      if (collaborationEvents.length > 10) {
        collaborationLevel = 'large_team'
      } else if (collaborationEvents.length > 3) {
        collaborationLevel = 'small_team'
      }

      // Features used
      const featuresUsed = featureEvents
        .map((e: any) => e.event_properties?.feature)
        .filter(Boolean)
        .filter((feature: any, index: number, arr: any[]) => arr.indexOf(feature) === index)

      return {
        dailyActiveUse,
        weeklyActiveUse,
        monthlyActiveUse,
        averageSessionDuration: 1200, // Would calculate from session data
        featuresUsed,
        preferredModels,
        preferredTemplates,
        codeComplexityPreference,
        collaborationLevel
      }

    } catch (error) {
      console.error('Error calculating usage profile:', error)
      return {
        dailyActiveUse: false,
        weeklyActiveUse: false,
        monthlyActiveUse: false,
        averageSessionDuration: 0,
        featuresUsed: [],
        preferredModels: [],
        preferredTemplates: [],
        codeComplexityPreference: 'simple',
        collaborationLevel: 'individual'
      }
    }
  }

  // Calculate value profile
  private async calculateValueProfile(userId: string, teamId: string, currentTier: string): Promise<ValueProfile> {
    try {
      // Get revenue attributions for lifetime value
      const { data: allRevenueData } = await this.supabase
        .from('revenue_attributions')
        .select('revenue_impact')
        .eq('user_id', userId)

      const lifetimeValue = allRevenueData?.reduce((sum: number, item: any) => sum + item.revenue_impact, 0) || 0

      // Get recent spending (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: recentRevenueData } = await this.supabase
        .from('revenue_attributions')
        .select('revenue_impact')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString())

      const monthlySpend = recentRevenueData?.reduce((sum: number, item: any) => sum + item.revenue_impact, 0) || 0

      // Calculate upsell potential based on usage patterns
      const { data: limitEvents } = await this.supabase
        .from('revenue_attributions')
        .select('*')
        .eq('user_id', userId)
        .eq('event_type', 'usage_limit_reached')
        .gte('created_at', thirtyDaysAgo.toISOString())

      const upsellPotential = Math.min(100, (limitEvents?.length || 0) * 20)

      // Determine price sensitivity based on tier and behavior
      let priceSettings: 'low' | 'medium' | 'high' = 'medium'
      if (currentTier === 'enterprise' || lifetimeValue > 500) {
        priceSettings = 'low'
      } else if (currentTier === 'free' && upsellPotential < 30) {
        priceSettings = 'high'
      }

      return {
        currentTier,
        monthlySpend,
        lifetimeValue,
        upsellPotential,
        pricesensitivity: priceSettings,
        priceSettings,
        featureValuePerception: {} // Would be populated from surveys/feedback
      }

    } catch (error) {
      console.error('Error calculating value profile:', error)
      return {
        currentTier: 'free',
        monthlySpend: 0,
        lifetimeValue: 0,
        upsellPotential: 0,
        pricesensitivity: 'high',
        priceSettings: 'high',
        featureValuePerception: {}
      }
    }
  }

  // Calculate risk profile
  private async calculateRiskProfile(userId: string, behaviorScore: BehaviorScore): Promise<RiskProfile> {
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      // Get recent activity for decline analysis
      const { data: recentActivity } = await this.supabase
        .from('revenue_attributions')
        .select('created_at, event_type, revenue_impact')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true })

      // Calculate usage decline
      const firstHalf = recentActivity?.slice(0, Math.floor((recentActivity?.length || 0) / 2)) || []
      const secondHalf = recentActivity?.slice(Math.floor((recentActivity?.length || 0) / 2)) || []
      
      const firstHalfActivity = firstHalf.length
      const secondHalfActivity = secondHalf.length
      const usageDeclineRate = firstHalfActivity > 0 ? 
        Math.max(0, ((firstHalfActivity - secondHalfActivity) / firstHalfActivity) * 100) : 0

      // Count negative events (errors, payment failures, etc.)
      const negativeEvents = recentActivity?.filter((a: any) => a.revenue_impact < 0) || []
      
      // Determine churn risk level
      let churnRisk: 'low' | 'medium' | 'high' | 'critical' = 'low'
      const riskFactors: string[] = []

      if (behaviorScore.engagementScore < 30) {
        riskFactors.push('low_engagement')
        churnRisk = 'medium'
      }

      if (usageDeclineRate > 50) {
        riskFactors.push('usage_decline')
        churnRisk = 'high'
      }

      if (negativeEvents.length > 5) {
        riskFactors.push('frequent_errors')
        churnRisk = 'high'
      }

      if (behaviorScore.overallScore < 20) {
        churnRisk = 'critical'
        riskFactors.push('very_low_engagement')
      }

      // Calculate retention score (inverse of churn risk)
      const retentionScore = churnRisk === 'critical' ? 10 : 
                           churnRisk === 'high' ? 30 :
                           churnRisk === 'medium' ? 60 : 85

      return {
        churnRisk,
        churnIndicators: riskFactors,
        retentionScore,
        supportTicketCount: 0, // Would be populated from support system
        usageDeclineRate,
        competitorRisk: 25 // Would be calculated from market data
      }

    } catch (error) {
      console.error('Error calculating risk profile:', error)
      return {
        churnRisk: 'medium',
        churnIndicators: [],
        retentionScore: 50,
        supportTicketCount: 0,
        usageDeclineRate: 0,
        competitorRisk: 25
      }
    }
  }

  // Assign user to segments
  private async assignUserSegments(
    userId: string,
    behaviorScore: BehaviorScore,
    usageProfile: UsageProfile,
    valueProfile: ValueProfile,
    riskProfile: RiskProfile
  ): Promise<string[]> {
    const segments: string[] = []
    const businessSegments = this.getBusinessSegments()

    // Check each segment criteria
    for (const segment of businessSegments) {
      let qualifies = true

      // Check behavior thresholds
      if (segment.criteria.valueThresholds.engagementScore && 
          behaviorScore.engagementScore < segment.criteria.valueThresholds.engagementScore) {
        qualifies = false
      }

      // Check tier requirements
      if (segment.criteria.demographicFilters.tier && 
          valueProfile.currentTier !== segment.criteria.demographicFilters.tier) {
        qualifies = false
      }

      // Check specific segment logic
      switch (segment.segmentId) {
        case 'power_users':
          if (behaviorScore.engagementScore < 80 || !usageProfile.dailyActiveUse) {
            qualifies = false
          }
          break
        
        case 'enterprise_prospects':
          if (usageProfile.collaborationLevel === 'individual' || behaviorScore.collaborationScore < 50) {
            qualifies = false
          }
          break
        
        case 'trial_converters':
          if (valueProfile.currentTier !== 'free' || valueProfile.upsellPotential < 50) {
            qualifies = false
          }
          break
        
        case 'churn_risk':
          if (riskProfile.churnRisk === 'low') {
            qualifies = false
          }
          break
        
        case 'ai_enthusiasts':
          if (usageProfile.preferredModels.length < 3 || behaviorScore.innovationScore < 60) {
            qualifies = false
          }
          break
      }

      if (qualifies) {
        segments.push(segment.segmentId)
      }
    }

    return segments
  }

  // Generate personalized recommendations
  private generateRecommendations(
    behaviorScore: BehaviorScore,
    usageProfile: UsageProfile,
    valueProfile: ValueProfile,
    riskProfile: RiskProfile
  ): string[] {
    const recommendations: string[] = []

    // Engagement recommendations
    if (behaviorScore.engagementScore < 50) {
      recommendations.push('Try the daily coding challenge to boost engagement')
      recommendations.push('Explore our tutorial series for new inspiration')
    }

    // Feature adoption recommendations
    if (behaviorScore.adoptionScore < 60) {
      recommendations.push('Discover advanced features in your settings')
      recommendations.push('Try GitHub integration to streamline your workflow')
    }

    // Collaboration recommendations
    if (behaviorScore.collaborationScore < 30 && usageProfile.collaborationLevel === 'individual') {
      recommendations.push('Invite team members to collaborate on projects')
      recommendations.push('Share your best fragments with the community')
    }

    // Upsell recommendations
    if (valueProfile.currentTier === 'free' && valueProfile.upsellPotential > 60) {
      recommendations.push('Upgrade to Pro to unlock unlimited executions')
      recommendations.push('Try our advanced AI models with a Pro subscription')
    }

    // Churn prevention recommendations
    if (riskProfile.churnRisk === 'high' || riskProfile.churnRisk === 'critical') {
      recommendations.push('Schedule a one-on-one session with our success team')
      recommendations.push('Check out recent feature updates you might have missed')
      recommendations.push('Join our community Discord for tips and support')
    }

    // Innovation recommendations
    if (behaviorScore.innovationScore > 70) {
      recommendations.push('Apply for our beta features early access program')
      recommendations.push('Consider becoming a community contributor')
    }

    return recommendations.slice(0, 5) // Limit to top 5 recommendations
  }

  // Get segment analytics for business intelligence
  async getSegmentAnalytics(timeRangeMonths: number = 6): Promise<UserSegment[]> {
    try {
      const segments = this.getBusinessSegments()
      
      // This would be populated by actual user data analysis
      // For now, returning the structure with placeholder data
      
      return segments.map(segment => ({
        ...segment,
        userCount: Math.floor(Math.random() * 1000) + 100,
        revenueContribution: Math.floor(Math.random() * 50000) + 10000,
        // Other metrics would be calculated from real data
      }))

    } catch (error) {
      console.error('Error getting segment analytics:', error)
      return []
    }
  }

  // Export user segments for external data sales
  async exportSegmentData(
    segmentIds: string[],
    anonymize: boolean = true
  ): Promise<Array<{
    segmentId: string
    userProfile: Partial<UserProfile>
  }>> {
    try {
      // This would export anonymized segment data for monetization
      // Implementation would ensure privacy compliance (GDPR, etc.)
      
      const exportData: Array<{
        segmentId: string
        userProfile: Partial<UserProfile>
      }> = []

      // Return anonymized data structure
      return exportData

    } catch (error) {
      console.error('Error exporting segment data:', error)
      return []
    }
  }
}

// Export singleton instance
export const userSegmentationService = UserSegmentationService.getInstance()
