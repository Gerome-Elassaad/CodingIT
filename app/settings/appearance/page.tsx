'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Check, Monitor, Moon, Sun, Loader2, Palette, Zap, Sparkles, Eye } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth'
import { getUserPreferences, updateUserPreferences } from '@/lib/user-settings'

const themes = [
  {
    name: 'Light',
    value: 'light' as const,
    icon: Sun,
    description: 'A clean, bright interface'
  },
  {
    name: 'Dark', 
    value: 'dark' as const,
    icon: Moon,
    description: 'Easy on your eyes in low light'
  },
  {
    name: 'System',
    value: 'system' as const,
    icon: Monitor,
    description: 'Adapts to your system settings'
  }
]

const fonts = [
  {
    name: 'Inter',
    value: 'inter' as const,
    description: 'Modern and readable sans-serif font',
    preview: 'The quick brown fox jumps over the lazy dog'
  },
  {
    name: 'JetBrains Mono',
    value: 'jetbrains-mono' as const,
    description: 'Monospace font optimized for coding',
    preview: 'const message = "Hello, World!";'
  },
  {
    name: 'Cal Sans',
    value: 'cal-sans' as const,
    description: 'Geometric sans-serif with character',
    preview: 'Design with purpose and clarity'
  }
]

export default function AppearanceSettings() {
  const { theme, setTheme } = useTheme()
  const { session } = useAuth(() => {}, () => {})
  const { toast } = useToast()
  
  const hasThemeCustomization = true
  const userSubscriptionTier = 'pro'

  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [selectedFont, setSelectedFont] = useState<'inter' | 'jetbrains-mono' | 'cal-sans'>('inter')
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  
  const [accentColor, setAccentColor] = useState('#3B82F6')
  const [borderRadius, setBorderRadius] = useState([8])
  const [animationsEnabled, setAnimationsEnabled] = useState(true)
  const [compactMode, setCompactMode] = useState(false)


  useEffect(() => {
    if (!session?.user?.id) return

    const loadPreferences = async () => {
      setIsLoading(true)
      try {
        const preferences = await getUserPreferences(session.user.id)
        
        if (preferences) {
          setSelectedTheme(preferences.theme)
          setSelectedFont(preferences.font_family)
          

          if (theme !== preferences.theme) {
            setTheme(preferences.theme)
          }
        }
      } catch (error) {
        console.error('Error loading appearance preferences:', error)
        toast({
          title: "Error",
          description: "Failed to load appearance settings. Please refresh the page.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadPreferences()
  }, [session?.user?.id, theme, setTheme, toast])

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    if (!session?.user?.id) return

    setIsUpdating(true)
    try {
      setSelectedTheme(newTheme)
      setTheme(newTheme)

      const success = await updateUserPreferences(session.user.id, {
        theme: newTheme
      })

      if (success) {
        toast({
          title: "Success",
          description: "Theme updated successfully.",
        })
      } else {
        setSelectedTheme(selectedTheme)
        setTheme(selectedTheme)
        throw new Error('Failed to save theme preference')
      }
    } catch (error) {
      console.error('Error updating theme:', error)
      toast({
        title: "Error",
        description: "Failed to save theme preference. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleFontChange = async (newFont: 'inter' | 'jetbrains-mono' | 'cal-sans') => {
    if (!session?.user?.id) return

    setIsUpdating(true)
    try {
      setSelectedFont(newFont)
      
      document.documentElement.style.fontFamily = getFontFamily(newFont)

      const success = await updateUserPreferences(session.user.id, {
        font_family: newFont
      })

      if (success) {
        toast({
          title: "Success",
          description: "Font updated successfully.",
        })
      } else {
        setSelectedFont(selectedFont)
        document.documentElement.style.fontFamily = getFontFamily(selectedFont)
        throw new Error('Failed to save font preference')
      }
    } catch (error) {
      console.error('Error updating font:', error)
      toast({
        title: "Error", 
        description: "Failed to save font preference. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const getFontFamily = (font: 'inter' | 'jetbrains-mono' | 'cal-sans') => {
    switch (font) {
      case 'inter':
        return 'Inter, system-ui, sans-serif'
      case 'jetbrains-mono':
        return '"JetBrains Mono", monospace'
      case 'cal-sans':
        return '"Cal Sans", system-ui, sans-serif'
      default:
        return 'Inter, system-ui, sans-serif'
    }
  }

  useEffect(() => {
    if (!isLoading) {
      document.documentElement.style.fontFamily = getFontFamily(selectedFont)
    }
  }, [selectedFont, isLoading])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium">Appearance</h2>
          <p className="text-sm text-muted-foreground">
            Customize how the interface looks and feels.
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
        <h2 className="text-lg font-medium flex items-center gap-2">
          Appearance
          {hasThemeCustomization && (
            <Badge variant="default" className="gap-1">
              <Palette className="w-3 h-3" />
              Pro Themes
            </Badge>
          )}
        </h2>
        <p className="text-sm text-muted-foreground">
          {hasThemeCustomization 
            ? 'Advanced customization options for your interface appearance.' 
            : 'Customize how the interface looks and feels.'
          }
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Theme
            {hasThemeCustomization && (
              <Badge variant="outline" className="gap-1">
                <Zap className="w-3 h-3" />
                Enhanced
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {hasThemeCustomization 
              ? 'Choose your theme and customize every detail.' 
              : 'Choose your preferred color scheme.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {themes.map((themeOption) => {
              const Icon = themeOption.icon
              const isSelected = selectedTheme === themeOption.value
              
              return (
                <button
                  key={themeOption.value}
                  onClick={() => handleThemeChange(themeOption.value)}
                  disabled={isUpdating}
                  className={cn(
                    'relative flex flex-col items-center p-4 border-2 rounded-lg transition-colors',
                    'hover:border-primary/50 focus:border-primary focus:outline-none',
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border',
                    isUpdating && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {isSelected && (
                    <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />
                  )}
                  
                  <div className={cn(
                    'mb-3 rounded-lg p-3',
                    themeOption.value === 'light' && 'bg-white border',
                    themeOption.value === 'dark' && 'bg-gray-900 border border-gray-700',
                    themeOption.value === 'system' && 'bg-gradient-to-r from-white to-gray-900 border'
                  )}>
                    <Icon className={cn(
                      'h-6 w-6',
                      themeOption.value === 'light' && 'text-gray-900',
                      themeOption.value === 'dark' && 'text-gray-100',
                      themeOption.value === 'system' && 'text-gray-600'
                    )} />
                  </div>
                  
                  <div className="text-center">
                    <Label className="font-medium">{themeOption.name}</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {themeOption.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Font</CardTitle>
          <CardDescription>
            Choose your preferred font family.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fonts.map((fontOption) => {
              const isSelected = selectedFont === fontOption.value
              
              return (
                <button
                  key={fontOption.value}
                  onClick={() => handleFontChange(fontOption.value)}
                  disabled={isUpdating}
                  className={cn(
                    'w-full flex items-start justify-between p-4 border-2 rounded-lg transition-colors text-left',
                    'hover:border-primary/50 focus:border-primary focus:outline-none',
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border',
                    isUpdating && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Label className="font-medium">{fontOption.name}</Label>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {fontOption.description}
                    </p>
                    <p 
                      className="text-sm"
                      style={{ fontFamily: getFontFamily(fontOption.value) }}
                    >
                      {fontOption.preview}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {hasThemeCustomization && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Advanced Customization
              <Badge variant="default">Pro</Badge>
            </CardTitle>
            <CardDescription>
              Fine-tune your interface with advanced theming options.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Accent Color</Label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-12 h-8 rounded border cursor-pointer"
                  disabled={!hasThemeCustomization}
                />
                <span className="text-sm font-mono text-muted-foreground">{accentColor}</span>
                <div className="flex gap-2">
                  {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setAccentColor(color)}
                      className="w-6 h-6 rounded-full border-2 border-gray-200"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <Label className="text-sm font-medium">Border Radius</Label>
              <div className="flex items-center gap-4">
                <Input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={borderRadius[0]}
                  onChange={(e) => setBorderRadius([parseInt(e.target.value)])}
                  className="flex-1"
                  disabled={!hasThemeCustomization}
                />
                <span className="text-sm font-medium min-w-[40px]">{borderRadius[0]}px</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Sharp</span>
                <span>Rounded</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Smooth Animations</Label>
                  <p className="text-xs text-muted-foreground">Enable transitions and micro-interactions</p>
                </div>
                <Button
                  variant={animationsEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAnimationsEnabled(!animationsEnabled)}
                  disabled={!hasThemeCustomization}
                >
                  {animationsEnabled ? 'On' : 'Off'}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Compact Mode</Label>
                  <p className="text-xs text-muted-foreground">Reduce spacing and padding for more content</p>
                </div>
                <Button
                  variant={compactMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCompactMode(!compactMode)}
                  disabled={!hasThemeCustomization}
                >
                  {compactMode ? 'On' : 'Off'}
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Live Preview
              </Label>
              <div 
                className="p-4 border-2 rounded-lg bg-card"
                style={{
                  borderRadius: `${borderRadius[0]}px`,
                  borderColor: accentColor + '40',
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: accentColor }}
                  />
                  <span className="text-sm font-medium">Preview Component</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  This is how your interface will look with the current settings.
                </p>
                <div 
                  className="px-3 py-2 text-xs text-white rounded"
                  style={{ 
                    backgroundColor: accentColor,
                    borderRadius: `${borderRadius[0] * 0.5}px`
                  }}
                >
                  Action Button
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isUpdating && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">Saving preferences...</span>
        </div>
      )}
    </div>
  )
}
