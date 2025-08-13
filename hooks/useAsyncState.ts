import { useState, useCallback, useRef, useEffect } from 'react'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

export interface AsyncActions<T> {
  execute: (...args: any[]) => Promise<T>
  reset: () => void
  setData: (data: T | null) => void
  setError: (error: Error | null) => void
}

function useAsyncState<T = any>(
  asyncFunction?: (...args: any[]) => Promise<T>,
  immediate: boolean = false
): AsyncState<T> & AsyncActions<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  })

  const mountedRef = useRef(true)
  const executionCountRef = useRef(0)

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const execute = useCallback(
    async (...args: any[]): Promise<T> => {
      if (!asyncFunction) {
        throw new Error('No async function provided')
      }

      const currentExecution = ++executionCountRef.current

      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const result = await asyncFunction(...args)

        // Only update state if this is the latest execution and component is mounted
        if (currentExecution === executionCountRef.current && mountedRef.current) {
          setState({ data: result, loading: false, error: null })
        }

        return result
      } catch (error) {
        // Only update state if this is the latest execution and component is mounted
        if (currentExecution === executionCountRef.current && mountedRef.current) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: error instanceof Error ? error : new Error(String(error))
          }))
        }
        throw error
      }
    },
    [asyncFunction]
  )

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null })
    executionCountRef.current = 0
  }, [])

  const setData = useCallback((data: T | null) => {
    setState(prev => ({ ...prev, data }))
  }, [])

  const setError = useCallback((error: Error | null) => {
    setState(prev => ({ ...prev, error }))
  }, [])

  useEffect(() => {
    if (immediate && asyncFunction) {
      execute()
    }
  }, [execute, immediate, asyncFunction])

  return {
    ...state,
    execute,
    reset,
    setData,
    setError,
  }
}

export default useAsyncState