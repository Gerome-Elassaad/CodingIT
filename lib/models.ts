import { createAnthropic } from '@ai-sdk/anthropic'
import { createFireworks } from '@ai-sdk/fireworks'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createMistral } from '@ai-sdk/mistral'
import { createOpenAI } from '@ai-sdk/openai'
import { createOllama } from 'ollama-ai-provider'
import modelsData from './models.json'

export type LLMModel = {
  id: string
  name: string
  provider: string
  providerId: string
  isBeta?: boolean
  multiModal?: boolean
  temperature?: number
  maxTokens?: number
}

export type LLMModelConfig = {
  model?: string
  apiKey?: string
  baseURL?: string
  temperature?: number
  topP?: number
  topK?: number
  frequencyPenalty?: number
  presencePenalty?: number
  maxTokens?: number
}

export function getModels(): LLMModel[] {
  // Return models from the JSON file
  return modelsData.models;
}

export function getModelClient(model: LLMModel, config: LLMModelConfig) {
  const { id: modelNameString, providerId } = model;
  const { apiKey, baseURL } = config;

  const providerMap = {
    anthropic: createAnthropic,
    openai: createOpenAI,
    google: createGoogleGenerativeAI,
    mistral: createMistral,
    ollama: createOllama,
    fireworks: createFireworks,
    groq: (config: any) => createOpenAI({
      ...config,
      apiKey: config.apiKey || process.env.GROQ_API_KEY,
      baseURL: config.baseURL || 'https://api.groq.com/openai/v1',
    }),
    togetherai: (config: any) => createOpenAI({
      ...config,
      apiKey: config.apiKey || process.env.TOGETHER_API_KEY,
      baseURL: config.baseURL || 'https://api.together.xyz/v1',
    }),
    xai: (config: any) => createOpenAI({
      ...config,
      apiKey: config.apiKey || process.env.XAI_API_KEY,
      baseURL: config.baseURL || 'https://api.x.ai/v1',
    }),
    deepseek: (config: any) => createOpenAI({
      ...config,
      apiKey: config.apiKey || process.env.DEEPSEEK_API_KEY,
      baseURL: config.baseURL || 'https://api.deepseek.com/v1',
    }),
  };

  const provider = providerMap[providerId as keyof typeof providerMap];

  if (!provider) {
    if (providerId === 'vertex') {
      // Handle Vertex AI separately due to its async nature
      const { createVertexClient } = require('./server-models');
      return createVertexClient(modelNameString, apiKey);
    }
    throw new Error(`Unsupported provider: ${providerId}`);
  }

  return provider({ apiKey, baseURL })(modelNameString);
}
