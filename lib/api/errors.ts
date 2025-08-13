import { NextResponse } from 'next/server'

export enum ApiErrorType {
  VALIDATION_ERROR = 'validation_error',
  AUTHENTICATION_ERROR = 'auth_error',
  AUTHORIZATION_ERROR = 'authorization_error',
  RATE_LIMIT_ERROR = 'rate_limit',
  SERVICE_OVERLOAD = 'service_overload',
  MODEL_ERROR = 'model_error',
  NETWORK_ERROR = 'network_error',
  CONFIG_ERROR = 'config_error',
  SANDBOX_CREATION_ERROR = 'sandbox_creation_error',
  EXECUTION_ERROR = 'execution_error',
  DATABASE_ERROR = 'database_error',
  UNKNOWN_ERROR = 'unknown_error'
}

export interface ApiError {
  error: string
  type: ApiErrorType
  details?: string
  retryAfter?: number
  field?: string
}

export class ApiException extends Error {
  public readonly type: ApiErrorType
  public readonly statusCode: number
  public readonly details?: string
  public readonly retryAfter?: number
  public readonly field?: string

  constructor(
    message: string,
    type: ApiErrorType,
    statusCode: number = 500,
    details?: string,
    retryAfter?: number,
    field?: string
  ) {
    super(message)
    this.name = 'ApiException'
    this.type = type
    this.statusCode = statusCode
    this.details = details
    this.retryAfter = retryAfter
    this.field = field
  }
}

export function createErrorResponse(
  error: string | ApiException,
  type?: ApiErrorType,
  statusCode: number = 500,
  details?: string,
  retryAfter?: number,
  field?: string
): NextResponse {
  let errorData: ApiError

  if (error instanceof ApiException) {
    errorData = {
      error: error.message,
      type: error.type,
      details: error.details,
      retryAfter: error.retryAfter,
      field: error.field
    }
    statusCode = error.statusCode
  } else {
    errorData = {
      error: typeof error === 'string' ? error : 'An unexpected error occurred',
      type: type || ApiErrorType.UNKNOWN_ERROR,
      details,
      retryAfter,
      field
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (errorData.retryAfter) {
    headers['Retry-After'] = errorData.retryAfter.toString()
  }

  return NextResponse.json(errorData, { status: statusCode, headers })
}

export function handleAIProviderError(error: any): ApiException {
  const isRateLimitError = error && (
    error.statusCode === 429 || 
    error.message?.includes('limit') || 
    error.message?.includes('rate')
  )

  const isOverloadedError = error && (
    error.statusCode === 529 || 
    error.statusCode === 503
  )

  const isAccessDeniedError = error && (
    error.statusCode === 403 || 
    error.statusCode === 401 || 
    error.message?.includes('unauthorized') || 
    (error.message?.includes('invalid') && error.message?.includes('key'))
  )

  const isModelError = error && (
    error.statusCode === 404 || 
    error.message?.includes('not found') || 
    error.message?.includes('model')
  )

  const isNetworkError = error && (
    error.code === 'ECONNREFUSED' || 
    error.code === 'ETIMEDOUT' || 
    error.message?.includes('network')
  )

  if (isRateLimitError) {
    return new ApiException(
      'Rate limit exceeded. Please try again later or use your own API key.',
      ApiErrorType.RATE_LIMIT_ERROR,
      429,
      error.message,
      60
    )
  }

  if (isOverloadedError) {
    return new ApiException(
      'The AI service is currently overloaded. Please try again in a few moments.',
      ApiErrorType.SERVICE_OVERLOAD,
      503,
      error.message,
      30
    )
  }

  if (isAccessDeniedError) {
    return new ApiException(
      'Invalid API key or access denied. Please check your API key configuration.',
      ApiErrorType.AUTHENTICATION_ERROR,
      403,
      error.message
    )
  }

  if (isModelError) {
    return new ApiException(
      'The selected AI model is not available. Please try a different model.',
      ApiErrorType.MODEL_ERROR,
      400,
      error.message
    )
  }

  if (isNetworkError) {
    return new ApiException(
      'Network connection failed. Please check your internet connection and try again.',
      ApiErrorType.NETWORK_ERROR,
      502,
      error.message
    )
  }

  return new ApiException(
    'An unexpected error occurred. Please try again. If the problem persists, try using a different AI model.',
    ApiErrorType.UNKNOWN_ERROR,
    500,
    error?.message || 'Unknown error'
  )
}

export function handleE2BError(error: any): ApiException {
  if (error.message?.includes('create') || error.message?.includes('sandbox')) {
    return new ApiException(
      'Failed to create sandbox environment. Please try again later.',
      ApiErrorType.SANDBOX_CREATION_ERROR,
      503,
      error.message
    )
  }

  if (error.message?.includes('execution') || error.message?.includes('code')) {
    return new ApiException(
      'Code execution failed. There may be an error in your code or dependencies.',
      ApiErrorType.EXECUTION_ERROR,
      500,
      error.message
    )
  }

  return new ApiException(
    'Sandbox service error occurred.',
    ApiErrorType.UNKNOWN_ERROR,
    500,
    error.message
  )
}

export function handleDatabaseError(error: any): ApiException {
  return new ApiException(
    'Database operation failed. Please try again later.',
    ApiErrorType.DATABASE_ERROR,
    500,
    error.message
  )
}

export function createValidationError(message: string, field?: string): ApiException {
  return new ApiException(
    message,
    ApiErrorType.VALIDATION_ERROR,
    400,
    undefined,
    undefined,
    field
  )
}

export function createAuthenticationError(message: string = 'Authentication required'): ApiException {
  return new ApiException(
    message,
    ApiErrorType.AUTHENTICATION_ERROR,
    401
  )
}

export function createAuthorizationError(message: string = 'Insufficient permissions'): ApiException {
  return new ApiException(
    message,
    ApiErrorType.AUTHORIZATION_ERROR,
    403
  )
}

export function createConfigError(message: string): ApiException {
  return new ApiException(
    message,
    ApiErrorType.CONFIG_ERROR,
    503
  )
}