import { supabase } from './supabase-client'
import { AnalyticsService } from './analytics-service'

// Revenue Attribution System
// Connects user behavior and feature usage to revenue generation

export interface RevenueAttribution {
  userId: string
  teamId: string
  eventId: string
  eventType: string
  eventTimestamp: string
  revenueImpact: number
  attributionType: 'direct' | 'influenced' | 'assisted'
  conversionPath: string[]
  timeToConversion?: number
  touchpointSequence: number
}

export interface ConversionPath {
  userId: string
  teamId: string
  touchpoints: Array<{
    eventType: string
    timestamp: string
    properties: Record<string, any>
    revenueWeight: number
  }>
  conversionEvent?: {
    eventType: string
    timestamp: string
    revenueAmount: number
    subscriptionTier: string
  }
  attributionModel: 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'position_based'
}

export interface FeatureValueAnalysis {
  featureName: string
  userTier: string
  usageFrequency: number
  retentionCorrelation: number
  upsellCorrelation: number
  churnReduction: number
  revenuePerUser: number
  featureValue: number
}

export class RevenueAttributionService {
  private static instance: RevenueAttributionService
  private supabase = supabase
  
  private constructor() {}

  static getInstance(): RevenueAttributionService {
    if (!RevenueAttributionService.instance) {
      RevenueAttributionService.instance = new RevenueAttributionService()
    }
    return RevenueAttributionService.instance
  }

  // Track revenue-impacting events
  async trackRevenueEvent(
    userId: string,
    eventType: string,
    properties: Record<string, any>,
    revenueImpact?: number
  ): Promise<void> {
    if (!this.supabase) return
    try {
      // Get user's team information
      const { data: userTeam } = await this.supabase
        .from('users_teams')
        .select('teams (id, tier)')
        .eq('user_id', userId)
        .eq('is_default', true)
        .single()

      if (!userTeam?.teams) return

      const teamId = (userTeam.teams as any).id
      const currentTier = (userTeam.teams as any).tier || 'free'

      // Calculate revenue impact based on event type and user tier
      const calculatedImpact = revenueImpact || this.calculateRevenueImpact(eventType, properties, currentTier)

      // Store revenue attribution record
      await this.supabase!.from('revenue_attributions').insert({
        user_id: userId,
        team_id: teamId,
        event_type: eventType,
        event_properties: properties,
        revenue_impact: calculatedImpact,
        attribution_type: this.determineAttributionType(eventType),
        created_at: new Date().toISOString()
      })

      // Update conversion path
      await this.updateConversionPath(userId, teamId, eventType, properties, calculatedImpact)

    } catch (error) {
      console.error('Error tracking revenue event:', error)
    }
  }

  // Calculate revenue impact of specific events
  private calculateRevenueImpact(
    eventType: string,
    properties: Record<string, any>,
    userTier: string
  ): number {
    const impactMapping: Record<string, (props: any, tier: string) => number> = {
      // Direct conversion events
      subscription_upgraded: (props, tier) => {
        const tierValues = { free: 0, pro: 20, enterprise: 100 }
        const fromValue = tierValues[props.fromTier as keyof typeof tierValues] || 0
        const toValue = tierValues[props.toTier as keyof typeof tierValues] || 0
        return toValue - fromValue
      },
      
      trial_converted: (props, tier) => {
        const tierValues = { pro: 20, enterprise: 100 }
        return tierValues[props.convertedToPlan as keyof typeof tierValues] || 20
      },

      // Feature usage that correlates with retention/upselling
      fragment_generated: (props, tier) => {
        const baseValue = tier === 'free' ? 0.5 : tier === 'pro' ? 1.0 : 2.0
        const complexityMultiplier = props.complexity === 'complex' ? 2.0 : props.complexity === 'medium' ? 1.5 : 1.0
        return baseValue * complexityMultiplier
      },

      model_switched: (props, tier) => {
        // Premium model usage indicates higher engagement and upsell potential
        const premiumModels = ['gpt-5', 'claude-opus-4', 'gemini-2.5-pro']
        if (premiumModels.includes(props.toModel)) {
          return tier === 'free' ? 5.0 : 2.0 // Higher impact for free users
        }
        return 1.0
      },

      github_integration: (props, tier) => {
        // Integration usage strongly correlates with enterprise adoption
        const baseValue = tier === 'free' ? 10.0 : tier === 'pro' ? 15.0 : 5.0
        const repoMultiplier = Math.log(props.repoCount || 1) + 1
        return baseValue * repoMultiplier
      },

      team_member_invited: (props, tier) => {
        // Team collaboration is a strong indicator of enterprise potential
        const teamSizeMultiplier = props.teamSize > 10 ? 3.0 : props.teamSize > 5 ? 2.0 : 1.5
        return tier === 'free' ? 15.0 * teamSizeMultiplier : 5.0 * teamSizeMultiplier
      },

      usage_limit_reached: (props, tier) => {
        // Hitting limits is a strong upsell signal
        const limitTypeValues = {
          api_calls: 10.0,
          execution_time: 8.0,
          storage: 6.0,
          github_imports: 12.0
        }
        return limitTypeValues[props.limitType as keyof typeof limitTypeValues] || 5.0
      },

      // Engagement events with moderate revenue correlation
      collaborative_edit: (props, tier) => 3.0,
      code_executed: (props, tier) => props.success ? 0.8 : 0.3,
      user_feedback_given: (props, tier) => props.rating > 3 ? 1.5 : 0.5,
      template_selected: (props, tier) => 0.5,
      
      // Negative revenue impact events
      payment_failed: () => -50.0,
      user_signed_out: () => -0.5,
      error_occurred: (props) => props.userImpact === 'high' ? -2.0 : -0.5,

      // Default for unknown events
      default: () => 0.1
    }

    const calculator = impactMapping[eventType] || impactMapping.default
    return calculator(properties, userTier)
  }

  // Determine attribution type based on event
  private determineAttributionType(eventType: string): 'direct' | 'influenced' | 'assisted' {
    const directEvents = ['subscription_upgraded', 'trial_converted', 'payment_failed']
    const influencedEvents = [
      'usage_limit_reached', 'github_integration', 'team_member_invited',
      'model_switched', 'fragment_generated'
    ]
    
    if (directEvents.includes(eventType)) return 'direct'
    if (influencedEvents.includes(eventType)) return 'influenced'
    return 'assisted'
  }

  // Update user's conversion path
  private async updateConversionPath(
    userId: string,
    teamId: string,
    eventType: string,
    properties: Record<string, any>,
    revenueImpact: number
  ): Promise<void> {
    if (!this.supabase) return
    try {
      // Get or create conversion path
      let { data: pathData } = await this.supabase
        .from('conversion_paths')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()

      const touchpoint = {
        eventType,
        timestamp: new Date().toISOString(),
        properties,
        revenueWeight: revenueImpact
      }

      if (pathData) {
        // Update existing path
        const touchpoints = pathData.touchpoints ? [...pathData.touchpoints, touchpoint] : [touchpoint]
        await this.supabase!
          .from('conversion_paths')
          .update({ 
            touchpoints,
            last_updated: new Date().toISOString()
          })
          .eq('id', pathData.id)
      } else {
        // Create new path
        await this.supabase!.from('conversion_paths').insert({
          user_id: userId,
          team_id: teamId,
          touchpoints: [touchpoint],
          is_active: true,
          created_at: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error('Error updating conversion path:', error)
    }
  }

  // Mark conversion and close path
  async recordConversion(
    userId: string,
    subscriptionTier: string,
    revenueAmount: number,
    attributionModel: 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'position_based' = 'linear'
  ): Promise<void> {
    if (!this.supabase) return
    try {
      // Get active conversion path
      const { data: pathData } = await this.supabase
        .from('conversion_paths')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()

      if (!pathData) return

      // Calculate attribution weights based on model
      const attributionWeights = this.calculateAttributionWeights(pathData.touchpoints, attributionModel)

      // Update path with conversion
      await this.supabase!
        .from('conversion_paths')
        .update({
          conversion_event: {
            eventType: 'subscription_upgraded',
            timestamp: new Date().toISOString(),
            revenueAmount,
            subscriptionTier
          },
          attribution_model: attributionModel,
          attribution_weights: attributionWeights,
          is_active: false,
          converted_at: new Date().toISOString()
        })
        .eq('id', pathData.id)

      // Create attributed revenue records
      for (let i = 0; i < pathData.touchpoints.length; i++) {
        const touchpoint = pathData.touchpoints[i]
        const weight = attributionWeights[i]
        const attributedRevenue = revenueAmount * weight

        await this.supabase!.from('revenue_attributions').insert({
          user_id: userId,
          team_id: pathData.team_id,
          event_type: touchpoint.eventType,
          event_properties: touchpoint.properties,
          revenue_impact: attributedRevenue,
          attribution_type: 'direct',
          conversion_path_id: pathData.id,
          attribution_weight: weight,
          created_at: touchpoint.timestamp
        })
      }

    } catch (error) {
      console.error('Error recording conversion:', error)
    }
  }

  // Calculate attribution weights based on selected model
  private calculateAttributionWeights(
    touchpoints: any[],
    model: 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'position_based'
  ): number[] {
    const count = touchpoints.length
    if (count === 0) return []

    switch (model) {
      case 'first_touch':
        return [1, ...Array(count - 1).fill(0)]
      
      case 'last_touch':
        return [...Array(count - 1).fill(0), 1]
      
      case 'linear':
        return Array(count).fill(1 / count)
      
      case 'time_decay':
        // More recent touchpoints get higher weight
        const decayRate = 0.7
        let weights = touchpoints.map((_, i) => Math.pow(decayRate, count - 1 - i))
        const sum = weights.reduce((a, b) => a + b, 0)
        return weights.map(w => w / sum)
      
      case 'position_based':
        // 40% first, 40% last, 20% distributed among middle
        if (count === 1) return [1]
        if (count === 2) return [0.4, 0.6]
        const middleWeight = 0.2 / (count - 2)
        return [0.4, ...Array(count - 2).fill(middleWeight), 0.4]
      
      default:
        return Array(count).fill(1 / count)
    }
  }

  // Analyze feature value for pricing decisions
  async analyzeFeatureValue(
    featureName: string,
    timeRangeMonths: number = 6
  ): Promise<FeatureValueAnalysis[]> {
    if (!this.supabase) return []
    try {
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - timeRangeMonths)

      // Get feature usage by tier
      const { data: featureUsage } = await this.supabase
        .from('revenue_attributions')
        .select(`
          event_properties,
          revenue_impact,
          users_teams!inner(
            teams!inner(tier)
          )
        `)
        .eq('event_type', 'feature_used')
        .eq('event_properties->feature', featureName)
        .gte('created_at', startDate.toISOString())

      // Group by tier and analyze
      const tierAnalysis: Record<string, any> = {}

      featureUsage?.forEach((usage: any) => {
        const tier = usage.users_teams?.teams?.tier || 'free'
        if (!tierAnalysis[tier]) {
          tierAnalysis[tier] = {
            usageCount: 0,
            totalRevenue: 0,
            users: new Set()
          }
        }
        tierAnalysis[tier].usageCount++
        tierAnalysis[tier].totalRevenue += usage.revenue_impact
      })

      // Convert to analysis format
      const analyses: FeatureValueAnalysis[] = Object.entries(tierAnalysis).map(([tier, data]) => ({
        featureName,
        userTier: tier,
        usageFrequency: data.usageCount,
        retentionCorrelation: 0.75, // Would be calculated from actual retention data
        upsellCorrelation: tier === 'free' ? 0.85 : 0.45,
        churnReduction: 0.25,
        revenuePerUser: data.totalRevenue / data.users.size,
        featureValue: data.totalRevenue
      }))

      return analyses

    } catch (error) {
      console.error('Error analyzing feature value:', error)
      return []
    }
  }

  // Generate revenue attribution report
  async generateAttributionReport(
    teamId: string,
    timeRangeMonths: number = 3
  ): Promise<{
    totalAttributedRevenue: number
    topRevenueEvents: Array<{ eventType: string; totalRevenue: number; eventCount: number }>
    conversionPaths: Array<{ pathLength: number; conversionRate: number; averageRevenue: number }>
    featureImpact: Array<{ feature: string; revenueImpact: number; usageCount: number }>
  }> {
    if (!this.supabase) return {
      totalAttributedRevenue: 0,
      topRevenueEvents: [],
      conversionPaths: [],
      featureImpact: []
    }
    try {
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - timeRangeMonths)

      // Get all revenue attributions for the team
      const { data: attributions } = await this.supabase
        .from('revenue_attributions')
        .select('*')
        .eq('team_id', teamId)
        .gte('created_at', startDate.toISOString())

      if (!attributions) return {
        totalAttributedRevenue: 0,
        topRevenueEvents: [],
        conversionPaths: [],
        featureImpact: []
      }

      // Calculate total attributed revenue
      const totalAttributedRevenue = attributions.reduce((sum: number, attr: any) => sum + attr.revenue_impact, 0)

      // Group by event type
      const eventGroups: Record<string, { totalRevenue: number; count: number }> = {}
      attributions.forEach((attr: any) => {
        if (!eventGroups[attr.event_type]) {
          eventGroups[attr.event_type] = { totalRevenue: 0, count: 0 }
        }
        eventGroups[attr.event_type].totalRevenue += attr.revenue_impact
        eventGroups[attr.event_type].count++
      })

      const topRevenueEvents = Object.entries(eventGroups)
        .map(([eventType, data]) => ({
          eventType,
          totalRevenue: data.totalRevenue,
          eventCount: data.count
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10)

      // Analyze conversion paths
      const { data: paths } = await this.supabase!
        .from('conversion_paths')
        .select('*')
        .eq('team_id', teamId)
        .gte('created_at', startDate.toISOString())

      const pathAnalysis: Record<number, { count: number; conversions: number; totalRevenue: number }> = {}
      paths?.forEach((path: any) => {
        const length = path.touchpoints?.length || 0
        if (!pathAnalysis[length]) {
          pathAnalysis[length] = { count: 0, conversions: 0, totalRevenue: 0 }
        }
        pathAnalysis[length].count++
        if (path.conversion_event) {
          pathAnalysis[length].conversions++
          pathAnalysis[length].totalRevenue += path.conversion_event.revenueAmount || 0
        }
      })

      const conversionPaths = Object.entries(pathAnalysis)
        .map(([pathLength, data]) => ({
          pathLength: parseInt(pathLength),
          conversionRate: data.conversions / data.count,
          averageRevenue: data.totalRevenue / Math.max(data.conversions, 1)
        }))
        .sort((a, b) => b.conversionRate - a.conversionRate)

      // Feature impact analysis
      const featureGroups: Record<string, { revenueImpact: number; usageCount: number }> = {}
      attributions
        .filter((attr: any) => attr.event_type === 'feature_used')
        .forEach((attr: any) => {
          const feature = attr.event_properties?.feature || 'unknown'
          if (!featureGroups[feature]) {
            featureGroups[feature] = { revenueImpact: 0, usageCount: 0 }
          }
          featureGroups[feature].revenueImpact += attr.revenue_impact
          featureGroups[feature].usageCount++
        })

      const featureImpact = Object.entries(featureGroups)
        .map(([feature, data]) => ({
          feature,
          revenueImpact: data.revenueImpact,
          usageCount: data.usageCount
        }))
        .sort((a, b) => b.revenueImpact - a.revenueImpact)
        .slice(0, 10)

      return {
        totalAttributedRevenue,
        topRevenueEvents,
        conversionPaths,
        featureImpact
      }

    } catch (error) {
      console.error('Error generating attribution report:', error)
      return {
        totalAttributedRevenue: 0,
        topRevenueEvents: [],
        conversionPaths: [],
        featureImpact: []
      }
    }
  }
}

// Export singleton instance
export const revenueAttributionService = RevenueAttributionService.getInstance()
