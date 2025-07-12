'use client'

import { useEffect } from 'react'

export function GlobalErrorHandler() {
  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason)
      
      // Prevent the default browser behavior (logging to console)
      event.preventDefault()
      
      // You could also send this to an error reporting service
      // errorReportingService.captureException(event.reason)
    }

    // Handle uncaught JavaScript errors
    const handleError = (event: ErrorEvent) => {
      console.error('Uncaught error:', event.error || event.message)
      
      // You could also send this to an error reporting service
      // errorReportingService.captureException(event.error || new Error(event.message))
    }

    // Add event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    // Cleanup function
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [])

  return null // This component doesn't render anything
}