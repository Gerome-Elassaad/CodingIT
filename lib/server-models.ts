"use server";

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createVertex } from '@ai-sdk/google-vertex';

export async function createVertexClient(modelNameString: string, apiKey?: string) {
  const vertexCredentials = process.env.GOOGLE_VERTEX_CREDENTIALS;

  // Handle both API key and JSON credentials
  if (!vertexCredentials) {
    // Fallback to Google AI SDK if no Vertex credentials
    return createGoogleGenerativeAI({
      apiKey: apiKey || process.env.GOOGLE_AI_API_KEY
    })(modelNameString);
  }

  // Try to parse as JSON first (service account credentials)
  try {
    const credentials = JSON.parse(vertexCredentials);
    return createVertex({
      googleAuthOptions: { credentials },
    })(modelNameString);
  } catch {
    // If not JSON, treat as API key and use Google AI SDK instead
    return createGoogleGenerativeAI({
      apiKey: vertexCredentials || apiKey || process.env.GOOGLE_AI_API_KEY
    })(modelNameString);
  }
}
