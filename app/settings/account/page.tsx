'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  AlertTriangle, 
  Camera, 
  Shield, 
  Loader2,
  User,
  Mail,
  Lock,
  Bell
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { useAuthContext } from '@/lib/auth-provider'
import { supabase } from '@/lib/supabase-client'
import { 
  getUserProfile, 
  getUserPreferences, 
  getUserSecuritySettings,
  updateUserProfile, 
  updateUserPreferences, 
  updateUserSecuritySettings
} from '@/lib/user-settings'

interface AccountFormData {
  email: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
  emailNotifications: boolean
  securityAlerts: boolean
  twoFactorEnabled: boolean
  avatarUrl: string
}

interface FormErrors {
  email?: string
  newPassword?: string
  confirmPassword?: string
  general?: string
}

export default function AccountSettings() {
  const { session, loading: authLoading } = useAuthContext()
  const { toast } = useToast()
  
  // Consolidated form state
  const [formData, setFormData] = useState<AccountFormData>({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    emailNotifications: true,
    securityAlerts: true,
    twoFactorEnabled: false,
    avatarUrl: ''
  })
  
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  
  // Track changes
  const [hasEmailChanged, setHasEmailChanged] = useState(false)
  const [hasPasswordChanged, setHasPasswordChanged] = useState(false)

  const loadUserData = useCallback(async () => {
    if (!session?.user?.id) return
    
    setIsLoading(true)
    try {
      const [profile, preferences, securitySettings] = await Promise.allSettled([
        getUserProfile(session.user.id),
        getUserPreferences(session.user.id),
        getUserSecuritySettings(session.user.id)
      ])

      setFormData(prev => ({
        ...prev,
        email: session.user.email || '',
        avatarUrl: profile.status === 'fulfilled' ? profile.value?.avatar_url || '' : '',
        emailNotifications: preferences.status === 'fulfilled' ? preferences.value?.email_notifications ?? true : true,
        securityAlerts: preferences.status === 'fulfilled' ? preferences.value?.security_alerts ?? true : true,
        twoFactorEnabled: securitySettings.status === 'fulfilled' ? securitySettings.value?.two_factor_enabled ?? false : false
      }))
      
      setHasEmailChanged(false)
      setHasPasswordChanged(false)
    } catch (error) {
      console.error('Error loading user data:', error)
      toast({
        title: "Warning",
        description: "Some account data couldn't be loaded. Basic functionality remains available.",
        variant: "default",
      })
    } finally {
      setIsLoading(false)
    }
  }, [session, toast])

  useEffect(() => {
    if (!authLoading) {
      loadUserData()
    }
  }, [loadUserData, authLoading])

  const updateFormData = (field: keyof AccountFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Track changes
    if (field === 'email' && session?.user?.email && value !== session.user.email) {
      setHasEmailChanged(true)
    }
    if (field === 'newPassword' || field === 'confirmPassword') {
      setHasPasswordChanged(true)
    }
    
    // Clear related errors
    setFormErrors(prev => ({ ...prev, [field]: undefined, general: undefined }))
  }

  const validateEmail = (email: string): string | null => {
    if (!email.trim()) return 'Email is required'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return 'Please enter a valid email address'
    return null
  }

  const validatePassword = (): FormErrors => {
    const errors: FormErrors = {}
    
    if (!formData.newPassword) {
      errors.newPassword = 'Password is required'
    } else if (formData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      errors.newPassword = 'Password must contain uppercase, lowercase, and number'
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    
    return errors
  }

  const handleUpdateEmail = async () => {
    if (!supabase || !session?.user?.id || isUpdatingEmail) return
    
    const emailError = validateEmail(formData.email)
    if (emailError) {
      setFormErrors({ email: emailError })
      return
    }
    
    setIsUpdatingEmail(true)
    setFormErrors({})
    
    try {
      const { error } = await supabase.auth.updateUser({
        email: formData.email.trim()
      })

      if (error) throw error

      setHasEmailChanged(false)
      toast({
        title: "Email Update Initiated",
        description: "Please check your new email address for confirmation.",
      })
    } catch (error: any) {
      console.error('Error updating email:', error)
      setFormErrors({ general: error.message || "Failed to update email" })
      toast({
        title: "Error",
        description: error.message || "Failed to update email. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingEmail(false)
    }
  }

  const handleChangePassword = async () => {
    if (!supabase || isChangingPassword) return
    
    const passwordErrors = validatePassword()
    if (Object.keys(passwordErrors).length > 0) {
      setFormErrors(passwordErrors)
      return
    }
    
    setIsChangingPassword(true)
    setFormErrors({})
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      })

      if (error) throw error

      // Update security settings
      if (session?.user?.id) {
        await updateUserSecuritySettings(session.user.id, {
          last_password_change: new Date().toISOString()
        })
      }

      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }))
      setHasPasswordChanged(false)
      
      toast({
        title: "Success",
        description: "Password updated successfully.",
      })
    } catch (error: any) {
      console.error('Error changing password:', error)
      setFormErrors({ general: error.message || "Failed to change password" })
      toast({
        title: "Error",
        description: error.message || "Failed to change password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleUpdateNotificationSettings = async (key: 'emailNotifications' | 'securityAlerts', value: boolean) => {
    if (!session?.user?.id || isUpdatingSettings) return

    const prevValue = formData[key]
    updateFormData(key, value)

    setIsUpdatingSettings(true)
    try {
      const success = await updateUserPreferences(session.user.id, {
        [key === 'emailNotifications' ? 'email_notifications' : 'security_alerts']: value
      })

      if (success) {
        toast({
          title: "Success",
          description: "Notification settings updated.",
        })
      } else {
        throw new Error('Failed to update settings')
      }
    } catch (error) {
      console.warn('Could not save notification settings:', error)
      updateFormData(key, prevValue) // Revert
      
      toast({
        title: "Warning",
        description: "Settings changed locally but could not be saved.",
        variant: "default",
      })
    } finally {
      setIsUpdatingSettings(false)
    }
  }

  const handleToggle2FA = async () => {
    if (!session?.user?.id || isUpdatingSettings) return

    const newValue = !formData.twoFactorEnabled
    updateFormData('twoFactorEnabled', newValue)
    
    setIsUpdatingSettings(true)
    
    try {
      const success = await updateUserSecuritySettings(session.user.id, {
        two_factor_enabled: newValue
      })

      if (success) {
        toast({
          title: "Success",
          description: `Two-factor authentication ${newValue ? 'enabled' : 'disabled'}.`,
        })
      } else {
        throw new Error('Failed to update 2FA settings')
      }
    } catch (error) {
      console.warn('Could not save 2FA settings:', error)
      updateFormData('twoFactorEnabled', !newValue) // Revert
      toast({
        title: "Warning",
        description: "Setting changed locally but could not be saved.",
        variant: "default",
      })
    } finally {
      setIsUpdatingSettings(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !session?.user?.id || !supabase || isUploadingAvatar) return

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const maxSize = 2 * 1024 * 1024 // 2MB
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Please upload a valid image file (JPG, PNG, GIF, or WebP)",
        variant: "destructive",
      })
      return
    }
    
    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: "File size must be less than 2MB",
        variant: "destructive",
      })
      return
    }

    setIsUploadingAvatar(true)
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${session.user.id}/avatar.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      const success = await updateUserProfile(session.user.id, {
        avatar_url: data.publicUrl
      })

      if (success) {
        updateFormData('avatarUrl', data.publicUrl)
        toast({
          title: "Success",
          description: "Profile picture updated successfully.",
        })
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingAvatar(false)
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium">Account</h2>
          <p className="text-sm text-muted-foreground">
            Manage your account settings and security preferences.
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">Loading account settings...</span>
        </div>
      </div>
    )
  }

  // Not authenticated state
  if (!session?.user) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium">Account</h2>
          <p className="text-sm text-muted-foreground">
            Manage your account settings and security preferences.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="font-medium">Authentication Required</p>
                <p className="text-sm text-muted-foreground">
                  Please sign in to access your account settings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Account</h2>
        <p className="text-sm text-muted-foreground">
          Manage your account settings and security preferences.
        </p>
      </div>

      {/* General Error Display */}
      {formErrors.general && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">{formErrors.general}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Picture Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Picture
          </CardTitle>
          <CardDescription>
            Update your profile picture and display information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={formData.avatarUrl} alt="Profile picture" />
              <AvatarFallback>
                {session.user.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={isUploadingAvatar}
                onClick={() => document.getElementById('avatar-upload')?.click()}
              >
                {isUploadingAvatar ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4 mr-2" />
                )}
                Change picture
              </Button>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <p className="text-xs text-muted-foreground">
                JPG, PNG, GIF, or WebP. Max size 2MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Address
          </CardTitle>
          <CardDescription>
            Your email address is used for authentication and notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleUpdateEmail}
                disabled={isUpdatingEmail || !hasEmailChanged}
              >
                {isUpdatingEmail && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update
              </Button>
            </div>
            {formErrors.email && (
              <p className="text-sm text-destructive">{formErrors.email}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Password Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={(e) => updateFormData('newPassword', e.target.value)}
              placeholder="Enter new password"
            />
            {formErrors.newPassword && (
              <p className="text-sm text-destructive">{formErrors.newPassword}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => updateFormData('confirmPassword', e.target.value)}
              placeholder="Confirm new password"
            />
            {formErrors.confirmPassword && (
              <p className="text-sm text-destructive">{formErrors.confirmPassword}</p>
            )}
          </div>

          <Button 
            onClick={handleChangePassword}
            disabled={isChangingPassword || !hasPasswordChanged}
          >
            {isChangingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Change password
          </Button>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>
            Manage two-factor authentication and security features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                {formData.twoFactorEnabled 
                  ? 'Two-factor authentication is enabled' 
                  : 'Add extra security with 2FA'
                }
              </p>
            </div>
            <Button 
              variant={formData.twoFactorEnabled ? "destructive" : "default"}
              onClick={handleToggle2FA}
              disabled={isUpdatingSettings}
            >
              {isUpdatingSettings && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {formData.twoFactorEnabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Choose which notifications you want to receive.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications about your account activity
              </p>
            </div>
            <Switch
              checked={formData.emailNotifications}
              onCheckedChange={(checked) => handleUpdateNotificationSettings('emailNotifications', checked)}
              disabled={isUpdatingSettings}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Security alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about important security events
              </p>
            </div>
            <Switch
              checked={formData.securityAlerts}
              onCheckedChange={(checked) => handleUpdateNotificationSettings('securityAlerts', checked)}
              disabled={isUpdatingSettings}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible and destructive actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="font-medium">Delete Account</Label>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => {
                toast({
                  title: "Feature Not Available",
                  description: "Account deletion is not yet implemented. Please contact support if needed.",
                  variant: "default",
                })
              }}
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
