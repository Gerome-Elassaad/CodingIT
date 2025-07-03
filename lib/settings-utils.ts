export interface ValidationError {
  field: string
  message: string
}

export interface FormValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

// Profile validation
export function validateProfile(data: {
  full_name?: string
  display_name?: string
  work_description?: string
}): FormValidationResult {
  const errors: ValidationError[] = []

  if (data.full_name && data.full_name.length > 100) {
    errors.push({
      field: 'full_name',
      message: 'Full name must be less than 100 characters'
    })
  }

  if (data.display_name && data.display_name.length > 50) {
    errors.push({
      field: 'display_name',
      message: 'Display name must be less than 50 characters'
    })
  }

  if (data.full_name && data.full_name.trim().length < 2) {
    errors.push({
      field: 'full_name',
      message: 'Full name must be at least 2 characters'
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Email validation
export function validateEmail(email: string): FormValidationResult {
  const errors: ValidationError[] = []
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!email || email.trim().length === 0) {
    errors.push({
      field: 'email',
      message: 'Email is required'
    })
  } else if (!emailRegex.test(email)) {
    errors.push({
      field: 'email',
      message: 'Please enter a valid email address'
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Password validation
export function validatePassword(password: string, confirmPassword?: string): FormValidationResult {
  const errors: ValidationError[] = []

  if (!password || password.length === 0) {
    errors.push({
      field: 'password',
      message: 'Password is required'
    })
  } else {
    if (password.length < 8) {
      errors.push({
        field: 'password',
        message: 'Password must be at least 8 characters long'
      })
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push({
        field: 'password',
        message: 'Password must contain at least one lowercase letter'
      })
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push({
        field: 'password',
        message: 'Password must contain at least one uppercase letter'
      })
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push({
        field: 'password',
        message: 'Password must contain at least one number'
      })
    }
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    errors.push({
      field: 'confirmPassword',
      message: 'Passwords do not match'
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// File upload validation
export function validateFile(file: File, options: {
  maxSize?: number // in bytes
  allowedTypes?: string[]
}): FormValidationResult {
  const errors: ValidationError[] = []
  const { maxSize = 2 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/gif'] } = options

  if (file.size > maxSize) {
    errors.push({
      field: 'file',
      message: `File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`
    })
  }

  if (!allowedTypes.includes(file.type)) {
    errors.push({
      field: 'file',
      message: `File type must be one of: ${allowedTypes.map(type => type.split('/')[1]).join(', ')}`
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Error handling utilities
export class SettingsError extends Error {
  public readonly code: string
  public readonly field?: string

  constructor(message: string, code: string = 'UNKNOWN_ERROR', field?: string) {
    super(message)
    this.name = 'SettingsError'
    this.code = code
    this.field = field
  }
}

export function handleSettingsError(error: unknown): string {
  if (error instanceof SettingsError) {
    return error.message
  }

  if (error instanceof Error) {
    // Handle common Supabase errors
    if (error.message.includes('duplicate key')) {
      return 'This information is already in use'
    }
    
    if (error.message.includes('permission denied')) {
      return 'You do not have permission to perform this action'
    }

    if (error.message.includes('network')) {
      return 'Network error. Please check your connection and try again'
    }

    return error.message
  }

  return 'An unexpected error occurred'
}

// Debounced save utility
export function createDebouncedSave<T>(
  saveFunction: (data: T) => Promise<boolean>,
  delay: number = 1000
) {
  let timeoutId: NodeJS.Timeout | null = null

  return (data: T): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(async () => {
        try {
          const result = await saveFunction(data)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      }, delay)
    })
  }
}

// Local storage utilities for temporary data
export function saveToLocalStorage(key: string, data: any): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`settings_${key}`, JSON.stringify(data))
    }
  } catch (error) {
    console.warn('Failed to save to localStorage:', error)
  }
}

export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`settings_${key}`)
      if (stored) {
        return JSON.parse(stored)
      }
    }
  } catch (error) {
    console.warn('Failed to load from localStorage:', error)
  }
  return defaultValue
}

export function removeFromLocalStorage(key: string): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`settings_${key}`)
    }
  } catch (error) {
    console.warn('Failed to remove from localStorage:', error)
  }
}

// Format utilities
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatDate(dateString: string, options?: Intl.DateTimeFormatOptions): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  })
}

export function formatCurrency(cents: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(cents / 100)
}

// Theme utilities
export function applyFontFamily(fontFamily: 'inter' | 'jetbrains-mono' | 'cal-sans'): void {
  if (typeof document === 'undefined') return

  const fontMap = {
    'inter': 'Inter, system-ui, sans-serif',
    'jetbrains-mono': '"JetBrains Mono", monospace',
    'cal-sans': '"Cal Sans", system-ui, sans-serif'
  }

  document.documentElement.style.fontFamily = fontMap[fontFamily]
}

// Integration utilities
export function getIntegrationIcon(serviceName: string): string {
  const iconMap: { [key: string]: string } = {
    'github': '🐙',
    'google-drive': '📁',
    'gmail': '📧',
    'google-calendar': '📅',
    'slack': '💬',
    'discord': '🎮',
    'notion': '📝'
  }

  return iconMap[serviceName] || '🔗'
}

export function getIntegrationStatus(isConnected: boolean, lastSync?: string): {
  status: 'connected' | 'disconnected' | 'error'
  message: string
} {
  if (!isConnected) {
    return {
      status: 'disconnected',
      message: 'Not connected'
    }
  }

  if (lastSync) {
    const syncDate = new Date(lastSync)
    const now = new Date()
    const diffHours = (now.getTime() - syncDate.getTime()) / (1000 * 60 * 60)

    if (diffHours > 24) {
      return {
        status: 'error',
        message: 'Sync issues detected'
      }
    }
  }

  return {
    status: 'connected',
    message: 'Connected'
  }
}