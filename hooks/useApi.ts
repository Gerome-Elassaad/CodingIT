import { useCallback } from 'react'
import useAsyncState from './useAsyncState'

export interface ApiResponse<T = any> {
  data?: T
  success: boolean
  message?: string
  error?: string
  type?: string
  details?: string
}

export interface ApiOptions extends RequestInit {
  baseURL?: string
  timeout?: number
  retries?: number
  retryDelay?: number
}

export interface UseApiHook {
  loading: boolean
  error: Error | null
  data: any
  execute: <T = any>(url: string, options?: ApiOptions) => Promise<T>
  get: <T = any>(url: string, options?: Omit<ApiOptions, 'method'>) => Promise<T>
  post: <T = any>(url: string, data?: any, options?: Omit<ApiOptions, 'method' | 'body'>) => Promise<T>
  put: <T = any>(url: string, data?: any, options?: Omit<ApiOptions, 'method' | 'body'>) => Promise<T>
  patch: <T = any>(url: string, data?: any, options?: Omit<ApiOptions, 'method' | 'body'>) => Promise<T>
  delete: <T = any>(url: string, options?: Omit<ApiOptions, 'method'>) => Promise<T>
  reset: () => void
}

class ApiError extends Error {
  public statusCode: number
  public response?: Response
  public data?: any

  constructor(message: string, statusCode: number, response?: Response, data?: any) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.response = response
    this.data = data
  }
}

function useApi(defaultOptions: ApiOptions = {}): UseApiHook {
  const { loading, error, data, execute: executeAsync, reset, setData } = useAsyncState()

  const createAbortController = useCallback(() => {
    if (typeof AbortController !== 'undefined') {
      return new AbortController()
    }
    return null
  }, [])

  const sleep = useCallback((ms: number) => new Promise(resolve => setTimeout(resolve, ms)), [])

  const executeWithRetry = useCallback(async (
    fetchFn: () => Promise<Response>,
    retries: number = 0,
    retryDelay: number = 1000
  ): Promise<Response> => {
    try {
      return await fetchFn()
    } catch (error) {
      if (retries > 0 && error instanceof ApiError && error.statusCode >= 500) {
        await sleep(retryDelay)
        return executeWithRetry(fetchFn, retries - 1, retryDelay * 2) // Exponential backoff
      }
      throw error
    }
  }, [sleep])

  const execute = useCallback(async <T = any>(
    url: string,
    options: ApiOptions = {}
  ): Promise<T> => {
    const {
      baseURL = '',
      timeout = 30000,
      retries = 0,
      retryDelay = 1000,
      ...fetchOptions
    } = { ...defaultOptions, ...options }

    const fullUrl = baseURL ? `${baseURL}${url}` : url
    const abortController = createAbortController()

    // Set up timeout
    const timeoutId = setTimeout(() => {
      if (abortController) {
        abortController.abort()
      }
    }, timeout)

    const fetchFn = async () => {
      const response = await fetch(fullUrl, {
        ...fetchOptions,
        signal: abortController?.signal,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      })

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch {
          errorData = { error: response.statusText }
        }

        throw new ApiError(
          errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          response,
          errorData
        )
      }

      return response
    }

    try {
      const response = await executeWithRetry(fetchFn, retries, retryDelay)
      clearTimeout(timeoutId)

      // Handle different content types
      const contentType = response.headers.get('content-type')
      let data: T

      if (contentType?.includes('application/json')) {
        const jsonData: ApiResponse<T> = await response.json()
        data = jsonData.data !== undefined ? jsonData.data : (jsonData as T)
      } else if (contentType?.includes('text/')) {
        data = (await response.text()) as T
      } else {
        data = (await response.blob()) as T
      }

      setData(data)
      return data
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408)
      }
      
      throw error
    }
  }, [defaultOptions, createAbortController, executeWithRetry, setData])

  // Convenience methods
  const get = useCallback(<T = any>(
    url: string, 
    options: Omit<ApiOptions, 'method'> = {}
  ) => {
    return executeAsync(() => execute<T>(url, { ...options, method: 'GET' }))
  }, [execute, executeAsync])

  const post = useCallback(<T = any>(
    url: string, 
    data?: any, 
    options: Omit<ApiOptions, 'method' | 'body'> = {}
  ) => {
    return executeAsync(() => execute<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }))
  }, [execute, executeAsync])

  const put = useCallback(<T = any>(
    url: string, 
    data?: any, 
    options: Omit<ApiOptions, 'method' | 'body'> = {}
  ) => {
    return executeAsync(() => execute<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }))
  }, [execute, executeAsync])

  const patch = useCallback(<T = any>(
    url: string, 
    data?: any, 
    options: Omit<ApiOptions, 'method' | 'body'> = {}
  ) => {
    return executeAsync(() => execute<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }))
  }, [execute, executeAsync])

  const deleteMethod = useCallback(<T = any>(
    url: string, 
    options: Omit<ApiOptions, 'method'> = {}
  ) => {
    return executeAsync(() => execute<T>(url, { ...options, method: 'DELETE' }))
  }, [execute, executeAsync])

  return {
    loading,
    error,
    data,
    execute: executeAsync,
    get,
    post,
    put,
    patch,
    delete: deleteMethod,
    reset,
  }
}

export { ApiError }
export default useApi