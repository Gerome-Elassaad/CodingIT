import { createServerClient } from './supabase-server'
import { incrementUsage, canUseFeature } from './subscription'

export type UsageType = 'github_imports' | 'storage_mb' | 'api_calls' | 'execution_time_seconds'

export interface UsageTracker {
  trackGithubImport(teamId: string): Promise<boolean>
  trackStorageUsage(teamId: string, sizeInMB: number): Promise<boolean>
  trackApiCall(teamId: string): Promise<boolean>
  trackExecutionTime(teamId: string, timeInSeconds: number): Promise<boolean>
  getCurrentUsage(teamId: string, usageType: UsageType): Promise<number>
  resetMonthlyUsage(teamId: string): Promise<void>
}

class ProductionUsageTracker implements UsageTracker {
  async trackGithubImport(teamId: string): Promise<boolean> {
    try {
      // Check if team can import more repos
      const canImport = await canUseFeature(teamId, 'github_imports', 1)
      if (!canImport) {
        console.warn(`Team ${teamId} has reached GitHub import limit`)
        return false
      }

      // Increment usage
      const success = await incrementUsage(teamId, 'github_imports', 1)
      if (success) {
        console.log(`Tracked GitHub import for team ${teamId}`)
      }
      
      return success
    } catch (error) {
      console.error('Error tracking GitHub import:', error)
      return false
    }
  }

  async trackStorageUsage(teamId: string, sizeInMB: number): Promise<boolean> {
    try {
      const canStore = await canUseFeature(teamId, 'storage_mb', sizeInMB)
      if (!canStore) {
        console.warn(`Team ${teamId} would exceed storage limit with ${sizeInMB}MB`)
        return false
      }

      const success = await incrementUsage(teamId, 'storage_mb', sizeInMB)
      if (success) {
        console.log(`Tracked ${sizeInMB}MB storage usage for team ${teamId}`)
      }
      
      return success
    } catch (error) {
      console.error('Error tracking storage usage:', error)
      return false
    }
  }

  async trackApiCall(teamId: string): Promise<boolean> {
    try {
      const canCall = await canUseFeature(teamId, 'api_calls', 1)
      if (!canCall) {
        console.warn(`Team ${teamId} has reached API call limit`)
        return false
      }

      const success = await incrementUsage(teamId, 'api_calls', 1)
      if (success) {
        console.log(`Tracked API call for team ${teamId}`)
      }
      
      return success
    } catch (error) {
      console.error('Error tracking API call:', error)
      return false
    }
  }

  async trackExecutionTime(teamId: string, timeInSeconds: number): Promise<boolean> {
    try {
      const canExecute = await canUseFeature(teamId, 'execution_time_seconds', timeInSeconds)
      if (!canExecute) {
        console.warn(`Team ${teamId} would exceed execution time limit with ${timeInSeconds}s`)
        return false
      }

      const success = await incrementUsage(teamId, 'execution_time_seconds', timeInSeconds)
      if (success) {
        console.log(`Tracked ${timeInSeconds}s execution time for team ${teamId}`)
      }
      
      return success
    } catch (error) {
      console.error('Error tracking execution time:', error)
      return false
    }
  }

  async getCurrentUsage(teamId: string, usageType: UsageType): Promise<number> {
    try {
      const supabase = createServerClient()
      
      const { data, error } = await supabase
        .from('team_usage_limits')
        .select('current_usage')
        .eq('team_id', teamId)
        .eq('usage_type', usageType)
        .single()

      if (error) {
        console.error(`Error getting current usage for ${usageType}:`, error)
        return 0
      }

      return data?.current_usage || 0
    } catch (error) {
      console.error('Error getting current usage:', error)
      return 0
    }
  }

  async resetMonthlyUsage(teamId: string): Promise<void> {
    try {
      const supabase = createServerClient(true) // Use service role
      
      // Reset all usage counters for the team
      const { error } = await supabase
        .from('team_usage_limits')
        .update({
          current_usage: 0,
          period_start: new Date().toISOString(),
          period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('team_id', teamId)

      if (error) {
        console.error('Error resetting monthly usage:', error)
        throw error
      }

      console.log(`Reset monthly usage for team ${teamId}`)
    } catch (error) {
      console.error('Error in resetMonthlyUsage:', error)
      throw error
    }
  }
}

// Singleton instance
export const usageTracker: UsageTracker = new ProductionUsageTracker()

// Helper functions for common usage tracking scenarios
export async function trackFileUpload(teamId: string, fileSizeMB: number): Promise<boolean> {
  return usageTracker.trackStorageUsage(teamId, fileSizeMB)
}

export async function trackCodeExecution(teamId: string, executionTimeSeconds: number): Promise<boolean> {
  // Track both API call and execution time
  const apiSuccess = await usageTracker.trackApiCall(teamId)
  const execSuccess = await usageTracker.trackExecutionTime(teamId, executionTimeSeconds)
  
  return apiSuccess && execSuccess
}

export async function trackGithubRepoImport(teamId: string): Promise<boolean> {
  return usageTracker.trackGithubImport(teamId)
}

// Usage analytics functions
export async function getTeamUsageAnalytics(teamId: string) {
  try {
    const [
      githubImports,
      storageUsage,
      apiCalls,
      executionTime
    ] = await Promise.all([
      usageTracker.getCurrentUsage(teamId, 'github_imports'),
      usageTracker.getCurrentUsage(teamId, 'storage_mb'),
      usageTracker.getCurrentUsage(teamId, 'api_calls'),
      usageTracker.getCurrentUsage(teamId, 'execution_time_seconds')
    ])

    return {
      github_imports: githubImports,
      storage_mb: storageUsage,
      api_calls: apiCalls,
      execution_time_seconds: executionTime,
      last_updated: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error getting team usage analytics:', error)
    return null
  }
}

// Usage limit checking functions
export async function canImportGithubRepo(teamId: string): Promise<boolean> {
  return canUseFeature(teamId, 'github_imports', 1)
}

export async function canUploadFile(teamId: string, fileSizeMB: number): Promise<boolean> {
  return canUseFeature(teamId, 'storage_mb', fileSizeMB)
}

export async function canExecuteCode(teamId: string, estimatedTimeSeconds: number = 30): Promise<boolean> {
  const canMakeApiCall = await canUseFeature(teamId, 'api_calls', 1)
  const canExecute = await canUseFeature(teamId, 'execution_time_seconds', estimatedTimeSeconds)
  
  return canMakeApiCall && canExecute
}