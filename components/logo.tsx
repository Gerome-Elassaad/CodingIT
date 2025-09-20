'use client'

import Image from 'next/image'
import { useTheme } from 'next-themes'
import { ComponentProps, useEffect, useState } from 'react'

export default function Logo(
  props: Omit<ComponentProps<typeof Image>, 'src' | 'alt'>
) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Use resolvedTheme for more accurate theme detection, fallback to theme
  const currentTheme = mounted ? (resolvedTheme || theme) : 'dark'

  // logo-dark.png for light mode (dark logo on light background)
  // logo.png for dark mode (light logo on dark background)
  const src = currentTheme === 'light' ? '/logo-dark.png' : '/logo.png'

  const { width, style } = props

  // Show a placeholder or default logo during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <Image
        src="/logo.png"
        alt="Logo"
        {...props}
        style={{ ...style, width, height: 'auto' }}
      />
    )
  }

  return (
    <Image
      src={src}
      alt="CodinIT Logo"
      {...props}
      style={{ ...style, width, height: 'auto' }}
    />
  )
}
