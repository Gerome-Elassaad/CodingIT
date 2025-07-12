'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type ThemeProviderProps } from 'next-themes/dist/types'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { AuthProvider as AuthContextProvider } from '@/lib/auth-provider'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return <>{children}</>
  }

  return (
    <PHProvider
      apiKey={process.env.NEXT_PUBLIC_POSTHOG_KEY}
      options={{
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        capture_pageview: false // Disable automatic pageview capture, as we capture manually
      }}
    >
      {children}
    </PHProvider>
  )
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    return <AuthContextProvider>{children}</AuthContextProvider>
}
