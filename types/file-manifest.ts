// File manifest types for enhanced edit tracking

export interface FileInfo {
  content: string;
  type: 'component' | 'page' | 'style' | 'config' | 'utility' | 'layout' | 'hook' | 'context';
  exports?: string[]; // Named exports and default export
  imports?: ImportInfo[]; // Dependencies
  lastModified: number;
  componentInfo?: ComponentInfo; // For React components
  path: string;
  relativePath: string; // Path relative to src/
}

export interface ImportInfo {
  source: string; // e.g., './Header', 'react', '@/components/Button'
  imports: string[]; // Named imports
  defaultImport?: string; // Default import name
  isLocal: boolean; // true if starts with './' or '@/'
}

export interface ComponentInfo {
  name: string;
  props?: string[]; // Prop names if detectable
  hooks?: string[]; // Hooks used (useState, useEffect, etc)
  hasState: boolean;
  childComponents?: string[]; // Components rendered inside
}

export interface RouteInfo {
  path: string; // Route path (e.g., '/videos', '/about')
  component: string; // Component file path
  layout?: string; // Layout component if any
}

export interface ComponentTree {
  [componentName: string]: {
    file: string;
    imports: string[]; // Components it imports
    importedBy: string[]; // Components that import it
    type: 'page' | 'layout' | 'component';
  }
}

export interface FileManifest {
  files: Record<string, FileInfo>;
  routes: RouteInfo[];
  componentTree: ComponentTree;
  entryPoint: string; // Usually App.jsx or main.jsx
  styleFiles: string[]; // All CSS files
  timestamp: number;
}

// Edit classification types
export enum EditType {
  UPDATE_COMPONENT = 'UPDATE_COMPONENT',    // "update the header", "change button color"
  ADD_FEATURE = 'ADD_FEATURE',              // "add a videos page", "create new component"
  FIX_ISSUE = 'FIX_ISSUE',                 // "fix the styling", "resolve error"
  REFACTOR = 'REFACTOR',                   // "reorganize", "clean up"
  FULL_REBUILD = 'FULL_REBUILD',           // "start over", "recreate everything"
  UPDATE_STYLE = 'UPDATE_STYLE',           // "change colors", "update theme"
  ADD_DEPENDENCY = 'ADD_DEPENDENCY'        // "install package", "add library"
}

export interface EditIntent {
  type: EditType;
  targetFiles: string[]; // Predicted files to edit
  confidence: number; // 0-1 confidence score
  description: string; // Human-readable description
  suggestedContext: string[]; // Additional files to include for context
}

// Patterns for intent detection
export interface IntentPattern {
  patterns: RegExp[];
  type: EditType;
  fileResolver: (prompt: string, manifest: FileManifest) => string[];
}