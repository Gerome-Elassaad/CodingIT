import { z } from 'zod'
import { createValidationError, ApiException } from './errors'

export async function validateJsonBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json()
    return schema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
      
      throw createValidationError(
        `Validation failed: ${issues.map(i => `${i.field}: ${i.message}`).join(', ')}`,
        issues[0]?.field
      )
    }
    
    if (error instanceof SyntaxError) {
      throw createValidationError('Invalid JSON format')
    }
    
    throw createValidationError('Request body validation failed')
  }
}

export function validateSearchParams(
  url: URL,
  schema: z.ZodSchema
): any {
  try {
    const params = Object.fromEntries(url.searchParams)
    return schema.parse(params)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
      
      throw createValidationError(
        `Query parameter validation failed: ${issues.map(i => `${i.field}: ${i.message}`).join(', ')}`,
        issues[0]?.field
      )
    }
    
    throw createValidationError('Query parameter validation failed')
  }
}

export function validatePathParams(
  params: Record<string, string | string[]>,
  schema: z.ZodSchema
): any {
  try {
    return schema.parse(params)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
      
      throw createValidationError(
        `Path parameter validation failed: ${issues.map(i => `${i.field}: ${i.message}`).join(', ')}`,
        issues[0]?.field
      )
    }
    
    throw createValidationError('Path parameter validation failed')
  }
}

// Common validation schemas
export const commonSchemas = {
  id: z.string().uuid('Invalid ID format'),
  
  pagination: z.object({
    page: z.string().transform(Number).pipe(z.number().min(1).default(1)),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100).default(20)),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('desc')
  }),
  
  teamId: z.string().uuid('Invalid team ID'),
  
  userId: z.string().uuid('Invalid user ID'),
  
  apiKey: z.string().min(10, 'API key too short'),
  
  url: z.string().url('Invalid URL format'),
  
  email: z.string().email('Invalid email format'),
  
  nonEmptyString: z.string().min(1, 'Field cannot be empty'),
  
  positiveNumber: z.number().positive('Must be a positive number'),
  
  dateString: z.string().datetime('Invalid date format'),
  
  githubRepo: z.object({
    owner: z.string().min(1, 'Repository owner required'),
    repo: z.string().min(1, 'Repository name required')
  }),
  
  modelConfig: z.object({
    model: z.string().optional(),
    apiKey: z.string().optional(),
    baseURL: z.string().url().optional(),
    temperature: z.number().min(0).max(2).optional(),
    topP: z.number().min(0).max(1).optional(),
    topK: z.number().min(1).optional(),
    frequencyPenalty: z.number().min(-2).max(2).optional(),
    presencePenalty: z.number().min(-2).max(2).optional(),
    maxTokens: z.number().min(1).max(100000).optional()
  }),
  
  codeExecution: z.object({
    sessionID: z.string().min(1, 'Session ID required'),
    code: z.string().min(1, 'Code cannot be empty'),
    timeout: z.number().min(1000).max(300000).optional()
  }),
  
  sandboxRequest: z.object({
    fragment: z.object({
      template: z.string().min(1, 'Template required'),
      code: z.union([z.string(), z.array(z.object({
        file_path: z.string(),
        file_content: z.string()
      }))]).optional(),
      file_path: z.string().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      port: z.number().min(1).max(65535).optional(),
      has_additional_dependencies: z.boolean().optional(),
      install_dependencies_command: z.string().optional(),
      additional_dependencies: z.array(z.string()).optional(),
      
      // Multi-file project support
      is_multi_file: z.boolean().optional(),
      files: z.array(z.object({
        file_path: z.string(),
        file_content: z.string(),
      })).optional(),
    }),
    userID: z.string().optional(),
    teamID: z.string().optional(),
    accessToken: z.string().optional()
  }),
  
  workflowExecution: z.object({
    inputData: z.record(z.any()).optional(),
    triggerType: z.enum(['manual', 'webhook', 'scheduled']).default('manual'),
    timeout: z.number().min(1000).max(1800000).optional()
  })
}

export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return async (request: Request): Promise<T> => {
    return validateJsonBody(request, schema)
  }
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
}

export function validateEnvironmentVariables(required: string[]): void {
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number
    allowedTypes?: string[]
    maxFiles?: number
  } = {}
): void {
  const { maxSize = 10 * 1024 * 1024, allowedTypes = [], maxFiles = 1 } = options
  
  if (file.size > maxSize) {
    throw createValidationError(`File size exceeds limit of ${maxSize} bytes`)
  }
  
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    throw createValidationError(`File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`)
  }
}