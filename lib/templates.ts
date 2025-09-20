import templates from './templates.json'

export default templates
export type Templates = typeof templates
export type TemplateId = keyof typeof templates
export type TemplateConfig = typeof templates[TemplateId]

export interface TemplateFileStructure {
  [fileName: string]: string
}

export interface EnhancedTemplateConfig {
  name: string
  lib: string[]
  file: string
  instructions: string
  port: number | null
  fileStructure?: TemplateFileStructure
  editableFiles?: string[]
  language?: 'python' | 'typescript' | 'javascript' | 'vue' | 'html' | 'css'
  supportsFileEditing?: boolean
}

export function templatesToPrompt(templates: Templates) {
  return `${Object.entries(templates).map(([id, t], index) => `${index + 1}. ${id}: "${t.instructions}". File: ${t.file || 'none'}. Dependencies installed: ${t.lib ? t.lib.join(', ') : 'none'}. Port: ${t.port || 'none'}.`).join('\n')}`
}

export function getTemplateFileStructure(templateId: TemplateId): TemplateFileStructure {
  const template = templates[templateId] as EnhancedTemplateConfig
  return template.fileStructure || {}
}

export function getEditableFiles(templateId: TemplateId): string[] {
  const template = templates[templateId] as EnhancedTemplateConfig
  return template.editableFiles || []
}

export function supportsFileEditing(templateId: TemplateId): boolean {
  const template = templates[templateId] as EnhancedTemplateConfig
  return template.supportsFileEditing || false
}

export function getTemplateLanguage(templateId: TemplateId): string {
  const template = templates[templateId] as EnhancedTemplateConfig
  return template.language || 'javascript'
}