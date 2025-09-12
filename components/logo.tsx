'use client'

import Image from 'next/image'
import { useTheme } from 'next-themes'
import { ComponentProps } from 'react'

export default function Logo(
  props: Omit<ComponentProps<typeof Image>, 'src' | 'alt'>
) {
  const { theme } = useTheme()
  const src = theme === 'light' ? '/logo-dark.png' : '/logo.png'
  const { width = 32, height = 32, style, ...rest } = props

  return (
    <Image
      src={src}
      alt="Logo"
      width={width}
      height={height}
      style={style}
      {...rest}
    />
  )
}
