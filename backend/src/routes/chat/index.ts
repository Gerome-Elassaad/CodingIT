import { Router } from 'express';
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
import ratelimit from '@/lib/ratelimit'
import { LLMModel, LLMModelConfig } from '@/lib/models'
import { TemplateId } from '@/lib/templates'
import templates from '@/lib/templates'
import { workflowDetector, WorkflowDetectionResult } from '@/lib/workflow-detector'
import { workflowPersistence } from '@/lib/workflow-persistence'
import { WorkflowSchema, FragmentNode } from '@/lib/workflow-engine'
import { fragmentNodeMapper } from '@/lib/fragment-node-mapper'

const router = Router();

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

const workflowResponseSchema = z.object({
  type: z.enum(['fragment', 'workflow']).describe('Whether this should be a single fragment or a multi-step workflow'),
  workflowSuggestion: z.object({
    name: z.string().describe('Suggested name for the workflow'),
    description: z.string().describe('Description of what the workflow does'),
    reasoning: z.string().describe('Why this should be a workflow instead of a single fragment')
  }).optional().describe('Workflow suggestion if type is workflow'),
  fragment: schema.optional().describe('Fragment data if type is fragment'),
  workflowSteps: z.array(z.object({
    name: z.string(),
    description: z.string(),
    template: z.string(),
    code: z.string(),
    dependencies: z.array(z.string()).default([])
  })).optional().describe('Workflow steps if type is workflow')
})

// Regular chat endpoint - POST /api/chat
router.post('/', async (req, res) => {
  try {
    const {
      messages,
      userID,
      teamID,
      template,
      model,
      config,
    } = req.body;

    // Validate the request body
    const validation = chatRequestSchema.safeParse({
      messages,
      userID,
      teamID,
      template,
      model,
      config,
    });

    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: validation.error.issues
      });
    }

    console.log('Chat request:', {
      userID,
      teamID,
      modelId: model.id,
      provider: model.provider,
      hasApiKey: !!config.apiKey
    })

    // Rate limiting
    const limit = !config.apiKey
      ? await ratelimit(
          req.headers['x-forwarded-for'] as string || req.ip,
          rateLimitMaxRequests,
          ratelimitWindow,
        )
      : false

    if (limit) {
      return res.status(429).json({
        error: 'You have reached your request limit for the day.',
        headers: {
          'X-RateLimit-Limit': limit.amount.toString(),
          'X-RateLimit-Remaining': limit.remaining.toString(),
          'X-RateLimit-Reset': limit.reset.toString(),
        }
      });
    }

    const { model: modelNameString, apiKey: modelApiKey, ...modelParams } = config
    
    // Handle template conversion - extract template name from object or use string directly
    const templateName = typeof template === 'string' ? template : template?.name || 'code-interpreter-v1'
    
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

    // Set appropriate headers for streaming
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    // Pipe the stream to the response
    const textStream = stream.toTextStreamResponse()
    const reader = textStream.body?.getReader()

    if (reader) {
      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            res.write(value)
          }
          res.end()
        } catch (error) {
          console.error('Stream error:', error)
          res.end()
        }
      }
      pump()
    } else {
      res.status(500).json({ error: 'Failed to create stream' })
    }

  } catch (error: any) {
    console.error('Chat API Error:', {
      message: error?.message,
      status: error?.statusCode,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    })

    const aiError = handleAIProviderError(error)
    return res.status(aiError.statusCode || 500).json({
      error: aiError.message,
      type: aiError.type
    })
  }
});

// Workflow chat endpoint - POST /api/chat/workflow
router.post('/workflow', async (req, res) => {
  try {
    const {
      messages,
      userID,
      teamID,
      template,
      model,
      config,
    }: {
      messages: CoreMessage[]
      userID: string | undefined
      teamID: string | undefined
      template: TemplateId
      model: LLMModel
      config: LLMModelConfig
    } = req.body;

    const limit = !config.apiKey
      ? await ratelimit(
          req.headers['x-forwarded-for'] as string || req.ip,
          rateLimitMaxRequests,
          ratelimitWindow,
        )
      : false

    if (limit) {
      return res.status(429).json({
        error: 'You have reached your request limit for the day.',
        headers: {
          'X-RateLimit-Limit': limit.amount.toString(),
          'X-RateLimit-Remaining': limit.remaining.toString(),
          'X-RateLimit-Reset': limit.reset.toString(),
        }
      });
    }

    const { model: modelNameString, apiKey: modelApiKey, ...modelParams } = config
    const modelClient = getModelClient(model, config)

    const detection: WorkflowDetectionResult = workflowDetector.detectWorkflow(messages)

    const basePrompt = toPrompt(templates)
    const workflowPrompt = detection.isWorkflow 
      ? `\n\nIMPORTANT: This request appears to be a multi-step workflow with ${detection.confidence * 100}% confidence. 
Consider breaking it down into multiple connected steps instead of a single fragment.

Detected workflow suggestion:
- Name: ${detection.suggestedName}
- Description: ${detection.suggestedDescription}
- Reason: ${detection.reason}

If you determine this should be a workflow, respond with type: "workflow" and provide workflowSteps.
If it should remain a single fragment, respond with type: "fragment" and provide fragment.`
      : '\n\nThis appears to be a single-step request. Create a single fragment unless the user explicitly requests multiple steps.'

    const systemPrompt = basePrompt + workflowPrompt

    const stream = await streamObject({
      model: modelClient as LanguageModel,
      schema: workflowResponseSchema,
      system: systemPrompt,
      messages,
      maxRetries: 0,
      ...modelParams,
    })

    if (userID) {
      stream.object.then(async (response) => {
        if (response?.type === 'workflow' && response.workflowSteps) {
          try {
            await createWorkflowFromSteps(response, userID, teamID)
          } catch (error) {
            console.error('Error processing workflow creation:', error)
          }
        }
      }).catch(() => {})
    }

    // Set appropriate headers for streaming
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    // Pipe the stream to the response
    const textStream = stream.toTextStreamResponse()
    const reader = textStream.body?.getReader()

    if (reader) {
      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            res.write(value)
          }
          res.end()
        } catch (error) {
          console.error('Stream error:', error)
          res.end()
        }
      }
      pump()
    } else {
      res.status(500).json({ error: 'Failed to create stream' })
    }

  } catch (error: any) {
    const isRateLimitError =
      error && (error.statusCode === 429 || error.message.includes('limit'))
    const isOverloadedError =
      error && (error.statusCode === 529 || error.statusCode === 503)
    const isAccessDeniedError =
      error && (error.statusCode === 403 || error.statusCode === 401)

    if (isRateLimitError) {
      return res.status(429).json({
        error: 'The provider is currently unavailable due to request limit. Try using your own API key.'
      });
    }

    if (isOverloadedError) {
      return res.status(529).json({
        error: 'The provider is currently unavailable. Please try again later.'
      });
    }

    if (isAccessDeniedError) {
      return res.status(403).json({
        error: 'Access denied. Please make sure your API key is valid.'
      });
    }

    return res.status(500).json({
      error: 'An unexpected error has occurred. Please try again later.'
    });
  }
});

async function createWorkflowFromSteps(
  response: any,
  userID: string,
  teamID?: string
): Promise<void> {
  try {
    const fragments: FragmentNode[] = response.workflowSteps.map((step: any, index: number) => {
      const fragmentSchema = {
        commentary: `Step ${index + 1}: ${step.name}`,
        template: step.template as TemplateId,
        title: step.name,
        description: step.description,
        additional_dependencies: [],
        has_additional_dependencies: false,
        install_dependencies_command: '',
        port: null,
        file_path: 'main.py',
        code: step.code
      }

      const node = fragmentNodeMapper.fragmentToNode(
        fragmentSchema, 
        { x: 100 + (index * 200), y: 100 }
      )

      node.id = `node_${index + 1}`
      node.dependencies = step.dependencies || (index === 0 ? [] : [`node_${index}`])

      return node
    })

    const connections = fragments.slice(1).map((fragment, index) => ({
      id: `conn_${index + 1}`,
      source: {
        nodeId: fragments[index].id,
        portId: 'output_1'
      },
      target: {
        nodeId: fragment.id,
        portId: 'input_1'
      },
      dataType: 'object' as const
    }))

    const workflow: Omit<WorkflowSchema, 'id' | 'created_at' | 'updated_at'> = {
      name: response.workflowSuggestion?.name || 'AI Generated Workflow',
      description: response.workflowSuggestion?.description || 'Multi-step workflow created by AI',
      fragments,
      connections,
      variables: [],
      triggers: [
        {
          id: 'trigger_1',
          type: 'manual',
          config: {}
        }
      ],
      version: 1
    }

    await workflowPersistence.createWorkflow(workflow, teamID || userID)
  } catch (error) {
    console.error('Error creating workflow from steps:', error)
  }
}

export const chatRouter = router;