import { LogEntry } from '@/lib/schema'
import { nanoid } from 'nanoid'

export type { LogEntry }

export function redactSensitiveInfo(message: string): string {
  let redacted = message

  const apiKeyPatterns = [
    // Anthropic API keys (sk-ant-...)
    /ANTHROPIC_API_KEY[=\s]*["']?(sk-ant-[a-zA-Z0-9_-]{20,})/gi,
    // OpenAI API keys (sk-...)
    /OPENAI_API_KEY[=\s]*["']?([sk-][a-zA-Z0-9_-]{20,})/gi,
    // GitHub tokens (ghp_, gho_, ghu_, ghs_, ghr_)
    /GITHUB_TOKEN[=\s]*["']?([gh][phosr]_[a-zA-Z0-9_]{20,})/gi,
    // Generic API key patterns
    /API_KEY[=\s]*["']?([a-zA-Z0-9_-]{20,})/gi,
    // Bearer tokens
    /Bearer\s+([a-zA-Z0-9_-]{20,})/gi,
    // Generic tokens
    /TOKEN[=\s]*["']?([a-zA-Z0-9_-]{20,})/gi,
  ]

  // Apply redaction patterns
  apiKeyPatterns.forEach((pattern) => {
    redacted = redacted.replace(pattern, (match, key) => {
      // Keep the prefix and show first 4 and last 4 characters
      const prefix = match.substring(0, match.indexOf(key))
      const redactedKey =
        key.length > 8
          ? `${key.substring(0, 4)}${'*'.repeat(Math.max(8, key.length - 8))}${key.substring(key.length - 4)}`
          : '*'.repeat(key.length)
      return `${prefix}${redactedKey}`
    })
  })

  // Redact environment variable assignments with sensitive values
  redacted = redacted.replace(
    /([A-Z_]*(?:KEY|TOKEN|SECRET|PASSWORD)[A-Z_]*)[=\s]*["']?([a-zA-Z0-9_-]{8,})["']?/gi,
    (match, varName, value) => {
      const redactedValue =
        value.length > 8
          ? `${value.substring(0, 4)}${'*'.repeat(Math.max(8, value.length - 8))}${value.substring(value.length - 4)}`
          : '*'.repeat(value.length)
      return `${varName}="${redactedValue}"`
    },
  )

  return redacted
}

export function createLogEntry(type: LogEntry['type'], message: string, timestamp?: Date): LogEntry {
  return {
    id: nanoid(),
    type,
    message: redactSensitiveInfo(message),
    timestamp: (timestamp || new Date()).toISOString(),
  }
}

export function createInfoLog(message: string): LogEntry {
  return createLogEntry('info', message)
}

export function createCommandLog(command: string, args?: string[]): LogEntry {
  const fullCommand = args ? `${command} ${args.join(' ')}` : command
  return createLogEntry('command', `$ ${fullCommand}`)
}

export function createErrorLog(message: string): LogEntry {
  return createLogEntry('error', message)
}

export function createSuccessLog(message: string): LogEntry {
  return createLogEntry('success', message)
}
