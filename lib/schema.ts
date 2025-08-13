import { z } from 'zod'

// Simple multi-file support schema (backward compatible)
export const multiFileSchema = z.object({
  file_path: z.string().describe('Relative path to the file, including the file name.'),
  file_content: z.string().describe('Complete content of the file.'),
})

// Enhanced fragment schema with minimal multi-file support
export const fragmentSchema = z.object({
  commentary: z.string().describe(`Describe what you're about to do and the steps you want to take for generating the fragment in great detail.`),
  template: z.string().describe('Name of the template used to generate the fragment.'),
  title: z.string().describe('Short title of the fragment. Max 3 words.'),
  description: z.string().describe('Short description of the fragment. Max 1 sentence.'),
  additional_dependencies: z.array(z.string()).describe('Additional dependencies required by the fragment. Do not include dependencies that are already included in the template.'),
  has_additional_dependencies: z.boolean().describe('Detect if additional dependencies that are not included in the template are required by the fragment.'),
  install_dependencies_command: z.string().describe('Command to install additional dependencies required by the fragment.'),
  port: z.number().nullable().describe('Port number used by the resulted fragment. Null when no ports are exposed.'),
  
  // Existing single-file support (always present for backward compatibility)
  file_path: z.string().describe('Relative path to the main file, including the file name.'),
  code: z.string().describe('Code for the main file. Only runnable code is allowed.'),
  
  // Optional multi-file support (additive, doesn't break existing)
  is_multi_file: z.boolean().optional().describe('Whether this fragment consists of multiple files. Defaults to false for backward compatibility.'),
  files: z.array(multiFileSchema).optional().describe('Additional files when is_multi_file is true. Main file is still in code/file_path for compatibility.'),
})

export type FragmentSchema = z.infer<typeof fragmentSchema>
