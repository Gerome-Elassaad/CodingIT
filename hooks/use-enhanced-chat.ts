'use client'

import { useState, useCallback, useEffect } from 'react'
import { useChat } from 'ai/react'
import { Templates } from '@/lib/templates'
import { LLMModel, LLMModelConfig } from '@/lib/models'
import { API_BASE_URL } from '@/lib/config'

export interface Message {
  id?: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt?: string
}

interface EnhancedChatConfig {
  userID?: string
  teamID?: string
  template: Templates
  model: LLMModel
  config: LLMModelConfig
  onFinish?: (message: Message) => void
}

export function useEnhancedChat(chatConfig: EnhancedChatConfig) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [context, setContext] = useState({
    cwd: '/home/project',
    projectFiles: [] as string[],
    userLevel: 'intermediate' as 'beginner' | 'intermediate' | 'expert',
    previousErrors: [] as string[],
    supabase: undefined as any
  })

  const { messages, input, setInput, append, isLoading, stop, error, setMessages } = useChat({
    api: `${API_BASE_URL}/api/chat`,
    body: {
      userID: chatConfig.userID,
      teamID: chatConfig.teamID,
      template: chatConfig.template,
      model: chatConfig.model,
      config: chatConfig.config,
      context
    },
    onFinish: chatConfig.onFinish
      ? (message: any) => {
          const { id, role, content, createdAt } = message;
          if (role === 'user' || role === 'assistant' || role === 'system') {
            chatConfig.onFinish!({ id, role, content, createdAt });
          }
        }
      : undefined
  })

  const updateContext = useCallback((newContext: Partial<typeof context>) => {
    setContext(prev => ({ ...prev, ...newContext }))
  }, [])

  const analyzeUserLevel = useCallback((userInput: string) => {
    const input = userInput.toLowerCase()
    
    if (input.includes('beginner') || 
        input.includes('new to') || 
        input.includes('just started') ||
        input.includes('explain') ||
        input.includes('what is')) {
      updateContext({ userLevel: 'beginner' })
    } else if (input.includes('advanced') || 
               input.includes('expert') || 
               input.includes('production') ||
               input.includes('optimize') ||
               input.includes('performance')) {
      updateContext({ userLevel: 'expert' })
    } else {
      updateContext({ userLevel: 'intermediate' })
    }
  }, [updateContext])

  const trackError = useCallback((error: string) => {
    setContext(prev => ({
      ...prev,
      previousErrors: [...prev.previousErrors.slice(-4), error] // Keep last 5 errors
    }))
  }, [])

  const submitMessage = useCallback(
    async (content: string, retryCount = 0) => {
      if (isSubmitting) return
      setIsSubmitting(true)
      analyzeUserLevel(content)

      try {
        await append({
          role: 'user',
          content,
        })
      } catch (error: any) {
        console.error('Submit message error:', error)
        
        // Auto-retry once for network errors
        if (retryCount === 0 && (error.message.includes('network') || error.message.includes('fetch'))) {
          console.log('Retrying message submission...')
          setTimeout(() => {
            setIsSubmitting(false)
            submitMessage(content, 1)
          }, 2000)
          return
        }
        
        trackError(error.message)
        throw error
      } finally {
        setIsSubmitting(false)
      }
    },
    [append, analyzeUserLevel, isSubmitting, trackError],
  )

  const executeCode = useCallback(
    async (code: string) => {
      if (isExecuting) return { error: 'Code execution already in progress' }
      setIsExecuting(true)

      try {
        const response = await fetch(`${API_BASE_URL}/api/code/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionID: chatConfig.userID,
            code,
          }),
        })

        if (!response.ok) {
          let errorMessage = 'Failed to execute code'
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } catch {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`
          }
          throw new Error(errorMessage)
        }

        const result = await response.json()
        
        // Reset error tracking on successful execution
        if (context.previousErrors.length > 0) {
          updateContext({ previousErrors: [] })
        }
        
        return result
      } catch (error: any) {
        const errorMessage = error.message || 'Unknown execution error'
        trackError(errorMessage)
        
        console.error('Code execution failed:', {
          error: errorMessage,
          code: code.substring(0, 200), // Log first 200 chars of code
          sessionID: chatConfig.userID
        })
        
        return { 
          error: errorMessage,
          type: 'execution_error'
        }
      } finally {
        setIsExecuting(false)
      }
    },
    [isExecuting, chatConfig.userID, trackError, context.previousErrors, updateContext],
  )

  useEffect(() => {
    if (error) {
      trackError(error.message)
    }
  }, [error, trackError])

  return {
    messages,
    input,
    setInput,
    submitMessage,
    isLoading: isLoading || isSubmitting || isExecuting,
    stop,
    error,
    context,
    updateContext,
    trackError,
    executeCode,
  }
}
