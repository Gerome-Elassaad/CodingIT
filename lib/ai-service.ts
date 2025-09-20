import { LLMModelConfig } from '@/lib/models';
import { Templates } from '@/lib/templates';

interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function sendChatMessage(
  messages: AIMessage[],
  template: Templates,
  model: string,
  config: LLMModelConfig
) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      template,
      model,
      config,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.body;
}

export async function applyGeneratedCode(code: string, isEdit: boolean = false) {
  const response = await fetch('/api/apply-ai-code-stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      response: code,
      isEdit: isEdit,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to apply code: ${response.statusText}`);
  }

  return response.body;
}
