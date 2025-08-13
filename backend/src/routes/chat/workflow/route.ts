import { Duration } from '@/lib/duration'
import { getModelClient } from '@/lib/models'
import { LLMModel, LLMModelConfig } from '@/lib/models'
import { toPrompt } from '@/lib/prompt'
import ratelimit from '@/lib/ratelimit'
import { fragmentSchema as schema } from '@/lib/schema'
import { TemplateId } from '@/lib/templates'
import templates from '@/lib/templates'
import { workflowDetector, WorkflowDetectionResult } from '@/lib/workflow-detector'
import { workflowPersistence } from '@/lib/workflow-persistence'
import { WorkflowSchema, FragmentNode } from '@/lib/workflow-engine'
import { fragmentNodeMapper } from '@/lib/fragment-node-mapper'
import { streamObject, LanguageModel, CoreMessage } from 'ai'
import { z } from 'zod'

export const maxDuration = 60

const rateLimitMaxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
  ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
  : 10
const ratelimitWindow = process.env.RATE_LIMIT_WINDOW
  ? (process.env.RATE_LIMIT_WINDOW as Duration)
  : '1d'

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

export async function POST(req: Request) {
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
  } = await req.json()

  const limit = !config.apiKey
    ? await ratelimit(
        req.headers.get('x-forwarded-for'),
        rateLimitMaxRequests,
        ratelimitWindow,
      )
    : false

  if (limit) {
    return new Response('You have reached your request limit for the day.', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.amount.toString(),
        'X-RateLimit-Remaining': limit.remaining.toString(),
        'X-RateLimit-Reset': limit.reset.toString(),
      },
    })
  }

  const { model: modelNameString, apiKey: modelApiKey, ...modelParams } = config
  const modelClient = getModelClient(model, config)

  try {
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

    return stream.toTextStreamResponse()
  } catch (error: any) {

    const isRateLimitError =
      error && (error.statusCode === 429 || error.message.includes('limit'))
    const isOverloadedError =
      error && (error.statusCode === 529 || error.statusCode === 503)
    const isAccessDeniedError =
      error && (error.statusCode === 403 || error.statusCode === 401)

    if (isRateLimitError) {
      return new Response(
        'The provider is currently unavailable due to request limit. Try using your own API key.',
        { status: 429 }
      )
    }

    if (isOverloadedError) {
      return new Response(
        'The provider is currently unavailable. Please try again later.',
        { status: 529 }
      )
    }

    if (isAccessDeniedError) {
      return new Response(
        'Access denied. Please make sure your API key is valid.',
        { status: 403 }
      )
    }

    return new Response(
      'An unexpected error has occurred. Please try again later.',
      { status: 500 }
    )
  }
}

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
  }
}