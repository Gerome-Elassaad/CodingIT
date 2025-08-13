import { z } from 'zod'
import {
  getModelClient,
  getDefaultModelParams,
} from '@/lib/models'
import { toPrompt } from '@/lib/prompt'
import { fragmentSchema as schema } from '@/lib/schema'
import { Templates } from '@/lib/templates'
import { streamObject, LanguageModel, CoreMessage } from 'ai'
import { createRateLimitedApiRoute } from '@/lib/api/middleware'
import { validateJsonBody } from '@/lib/api/validation'
import { handleAIProviderError, createErrorResponse } from '@/lib/api/errors'
import { Duration } from '@/lib/duration'

export const maxDuration = 300

const rateLimitMaxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
  ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
  : 10
const ratelimitWindow = process.env.RATE_LIMIT_WINDOW
  ? (process.env.RATE_LIMIT_WINDOW as Duration)
  : '1d'

const chatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.union([z.string(), z.array(z.any())]) // Allow both string and array content
  })),
  userID: z.string().optional(),
  teamID: z.string().optional(),
  template: z.union([z.string(), z.object({}).passthrough()]), // Allow both string and object
  model: z.object({
    id: z.string(),
    name: z.string(),
    provider: z.string(),
    providerId: z.string(),
    isBeta: z.boolean().optional()
  }),
  config: z.object({
    model: z.string().optional(),
    apiKey: z.string().optional(),
    baseURL: z.string().url().optional(),
    temperature: z.number().min(0).max(2).optional(),
    topP: z.number().min(0).max(1).optional(),
    topK: z.number().min(1).optional(),
    frequencyPenalty: z.number().min(-2).max(2).optional(),
    presencePenalty: z.number().min(-2).max(2).optional(),
    maxTokens: z.number().min(1).max(100000).optional()
  })
})

export const POST = createRateLimitedApiRoute(
  async ({ request }) => {
    const {
      messages,
      userID,
      teamID,
      template,
      model,
      config,
    } = await validateJsonBody(request, chatRequestSchema)

    console.log('Chat request:', {
      userID,
      teamID,
      modelId: model.id,
      provider: model.provider,
      hasApiKey: !!config.apiKey
    })

    const { model: modelNameString, apiKey: modelApiKey, ...modelParams } = config
    
    // Handle template conversion - extract template name from object or use string directly
    const templateName = typeof template === 'string' ? template : template?.name || 'code-interpreter-v1'
    
    try {
      const modelClient = getModelClient(model, config)

      const stream = streamObject({
        model: modelClient as LanguageModel,
        schema,
        system: toPrompt(templateName as Templates),
        messages: messages as CoreMessage[],
        maxRetries: 0,
        ...getDefaultModelParams(model),
        ...modelParams,
      })

      return stream.toTextStreamResponse()
    } catch (error: any) {
      console.error('Chat API Error:', {
        message: error?.message,
        status: error?.statusCode,
        provider: model.provider,
        modelId: model.id,
        userID,
        teamID,
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      })

      const aiError = handleAIProviderError(error)
      return createErrorResponse(aiError)
    }
  },
  {
    max: rateLimitMaxRequests,
    window: ratelimitWindow,
    skipWithApiKey: true
  },
  {
    security: { enableSecurityHeaders: true },
    validation: {
      maxBodySize: 1024 * 1024 // 1MB
    }
  }
)