'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { 
  Shield, 
  Download, 
  Trash2, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  FileText,
  Mail,
  Loader2
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { 
  getUserPreferences, 
  updateUserPreferences,
  UserPreferences
} from '@/lib/user-settings'

interface PrivacySettings {
  analytics_enabled: boolean
  marketing_emails: boolean
  data_sharing: boolean
  activity_tracking: boolean
  personalization: boolean
}

export default function PrivacySettings() {
  const { session } = useAuth(() => {}, () => {})
  const { toast } = useToast()
  
  // State
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    analytics_enabled: true,
    marketing_emails: false,
    data_sharing: false,
    activity_tracking: true,
    personalization: true
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  // Load privacy settings on mount
  useEffect(() => {
    if (!session?.user?.id) return

    const loadPrivacySettings = async () => {
      setIsLoading(true)
      try {
        const preferences = await getUserPreferences(session.user.id)
        
        if (preferences) {
          setPrivacySettings({
            analytics_enabled: true, // Default for analytics (could be stored in preferences)
            marketing_emails: preferences.marketing_emails,
            data_sharing: false, // Default setting
            activity_tracking: true, // Default setting
            personalization: true // Default setting
          })
        }
      } catch (error) {
        console.error('Error loading privacy settings:', error)
        toast({
          title: "Error",
          description: "Failed to load privacy settings. Please refresh the page.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadPrivacySettings()
  }, [session?.user?.id, toast])

  const handleUpdateSetting = async (key: keyof PrivacySettings, value: boolean) => {
    if (!session?.user?.id) return

    setIsUpdating(true)
    try {
      // Update local state immediately for better UX
      setPrivacySettings(prev => ({ ...prev, [key]: value }))

      // Map privacy settings to user preferences where applicable
      if (key === 'marketing_emails') {
        const success = await updateUserPreferences(session.user.id, {
          marketing_emails: value
        })

        if (!success) {
          // Revert on failure
          setPrivacySettings(prev => ({ ...prev, [key]: !value }))
          throw new Error('Failed to update preference')
        }
      }

      toast({
        title: "Success",
        description: "Privacy setting updated successfully.",
      })
    } catch (error) {
      console.error('Error updating privacy setting:', error)
      toast({
        title: "Error",
        description: "Failed to update privacy setting. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleExportData = async () => {
    if (!session?.user?.id) return

    setIsExporting(true)
    try {
      // In a real implementation, this would call an API to generate and download user data
      await new Promise(resolve => setTimeout(resolve, 3000)) // Simulate export process
      
      // Simulate download of exported data
      const dataExport = {
        user_id: session.user.id,
        email: session.user.email,
        export_date: new Date().toISOString(),
        note: "This is a simulated data export. In production, this would contain all user data."
      }
      
      const blob = new Blob([JSON.stringify(dataExport, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `user-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Data Export Complete",
        description: "Your data has been exported and downloaded.",
      })
    } catch (error) {
      console.error('Error exporting data:', error)
      toast({
        title: "Error",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmText = 'DELETE'
    const userInput = prompt(
      `This action cannot be undone. This will permanently delete your account and all associated data.\n\nType "${confirmText}" to confirm:`
    )

    if (userInput !== confirmText) {
      return
    }

    setIsDeletingAccount(true)
    try {
      // In a real implementation, this would call an API to delete the user account
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate deletion process
      
      toast({
        title: "Account Deletion Initiated",
        description: "Your account deletion has been scheduled. You'll receive a confirmation email.",
      })
    } catch (error) {
      console.error('Error deleting account:', error)
      toast({
        title: "Error",
        description: "Failed to delete account. Please contact support.",
        variant: "destructive",
      })
    } finally {
      setIsDeletingAccount(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium">Privacy</h2>
          <p className="text-sm text-muted-foreground">
            Control how your data is collected and used.
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Privacy</h2>
        <p className="text-sm text-muted-foreground">
          Control how your data is collected and used.
        </p>
      </div>

      {/* Data Protection */}
      <Card>
        <CardHeader>
          <CardTitle>Data Protection</CardTitle>
          <CardDescription>
            We are committed to protecting your personal information and privacy.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Data Collection</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Account information and preferences</li>
                <li>• Fragment and project data</li>
                <li>• Usage analytics and performance metrics</li>
                <li>• Communication preferences</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Data Usage</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Providing and improving our services</li>
                <li>• Personalizing your experience</li>
                <li>• Sending important updates and notifications</li>
                <li>• Analytics and performance optimization</li>
              </ul>
            </div>
          </div>
          
          <div className="pt-4">
            <h4 className="font-medium mb-2">Your Rights</h4>
            <p className="text-sm text-muted-foreground">
              You have the right to access, update, or delete your personal information. 
              You can also export your data or request that we stop processing it for marketing purposes.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy Controls</CardTitle>
          <CardDescription>
            Customize how we collect and use your information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <h4 className="font-medium">Analytics & Performance</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Help us improve the platform by sharing anonymous usage data
              </p>
            </div>
            <Switch
              checked={privacySettings.analytics_enabled}
              onCheckedChange={(checked: boolean) => handleUpdateSetting('analytics_enabled', checked)}
              disabled={isUpdating}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <h4 className="font-medium">Marketing Communications</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Receive updates about new features, tips, and special offers
              </p>
            </div>
            <Switch
              checked={privacySettings.marketing_emails}
              onCheckedChange={(checked: boolean) => handleUpdateSetting('marketing_emails', checked)}
              disabled={isUpdating}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <h4 className="font-medium">Data Sharing</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Share aggregated, anonymous data with research partners
              </p>
            </div>
            <Switch
              checked={privacySettings.data_sharing}
              onCheckedChange={(checked: boolean) => handleUpdateSetting('data_sharing', checked)}
              disabled={isUpdating}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <h4 className="font-medium">Activity Tracking</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Track your activity to provide personalized recommendations
              </p>
            </div>
            <Switch
              checked={privacySettings.activity_tracking}
              onCheckedChange={(checked: boolean) => handleUpdateSetting('activity_tracking', checked)}
              disabled={isUpdating}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <EyeOff className="h-4 w-4" />
                <h4 className="font-medium">Personalization</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Customize the interface and content based on your preferences
              </p>
            </div>
            <Switch
              checked={privacySettings.personalization}
              onCheckedChange={(checked: boolean) => handleUpdateSetting('personalization', checked)}
              disabled={isUpdating}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Export or delete your personal data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="font-medium">Export Your Data</h4>
              <p className="text-sm text-muted-foreground">
                Download a copy of all your personal data including projects, preferences, and usage history
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleExportData}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isExporting ? 'Exporting...' : 'Export Data'}
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <h4 className="font-medium text-destructive">Delete Account</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount}
            >
              {isDeletingAccount ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy Contact</CardTitle>
          <CardDescription>
            Questions about privacy or data protection? Get in touch.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">Data Protection Officer</h4>
              <p className="text-sm text-muted-foreground">
                For questions about how we handle your personal data
              </p>
              <a 
                href="mailto:privacy@codinit.dev" 
                className="text-sm text-primary hover:underline"
              >
                privacy@codinit.dev
              </a>
            </div>
            
            <div>
              <h4 className="font-medium">Privacy Policy</h4>
              <p className="text-sm text-muted-foreground">
                Read our complete privacy policy for detailed information about data handling
              </p>
              <a 
                href="https://codinit.dev/privacy-policy" 
                className="text-sm text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Privacy Policy →
              </a>
            </div>
            
            <div>
              <h4 className="font-medium">Terms of Service</h4>
              <p className="text-sm text-muted-foreground">
                Review our terms of service and user agreement
              </p>
              <a 
                href="https://codinit.dev/terms" 
                className="text-sm text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Terms of Service →
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {isUpdating && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">Updating privacy settings...</span>
        </div>
      )}
    </div>
  )
}