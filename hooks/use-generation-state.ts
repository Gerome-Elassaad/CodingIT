'use client';

import { useReducer, Reducer } from 'react';
import { appConfig } from '@/config/app.config';

export interface SandboxData {
  sandboxId: string;
  url: string;
  [key: string]: any;
}

export interface ChatMessage {
  content: string;
  type: 'user' | 'ai' | 'system' | 'file-update' | 'command' | 'error';
  timestamp: Date;
  metadata?: {
    scrapedUrl?: string;
    scrapedContent?: any;
    generatedCode?: string;
    appliedFiles?: string[];
    commandType?: 'input' | 'output' | 'error' | 'success';
  };
}

export interface CodeApplicationState {
  stage: 'analyzing' | 'installing' | 'applying' | 'complete' | null;
  packages?: string[];
  installedPackages?: string[];
  filesGenerated?: string[];
}

export interface GenerationProgress {
  isGenerating: boolean;
  status: string;
  components: Array<{ name: string; path: string; completed: boolean }>;
  currentComponent: number;
  streamedCode: string;
  isStreaming: boolean;
  isThinking: boolean;
  thinkingText?: string;
  thinkingDuration?: number;
  currentFile?: { path: string; content: string; type: string };
  files: Array<{ path: string; content: string; type: string; completed: boolean; edited?: boolean }>;
  lastProcessedPosition: number;
  isEdit?: boolean;
}

export interface ConversationContext {
  scrapedWebsites: Array<{ url: string; content: any; timestamp: Date }>;
  generatedComponents: Array<{ name: string; path: string; content: string }>;
  appliedCode: Array<{ files: string[]; timestamp: Date }>;
  currentProject: string;
  lastGeneratedCode?: string;
}

import { LLMModelConfig } from '@/lib/models';
import { TemplateId } from '@/lib/templates';

export interface GenerationState {
  sandboxData: SandboxData | null;
  loading: boolean;
  status: { text: string; active: boolean };
  responseArea: string[];
  structureContent: string;
  promptInput: string;
  chatMessages: ChatMessage[];
  aiChatInput: string;
  aiEnabled: boolean;
  aiModel: string; // This will be deprecated in favor of languageModel.model
  urlInput: string;
  urlStatus: string[];
  showHomeScreen: boolean;
  expandedFolders: Set<string>;
  selectedFile: string | null;
  homeScreenFading: boolean;
  homeUrlInput: string;
  homeContextInput: string;
  activeTab: 'generation' | 'preview';
  selectedStyle: string | null;
  showLoadingBackground: boolean;
  urlScreenshot: string | null;
  isScreenshotLoaded: boolean;
  isCapturingScreenshot: boolean;
  screenshotError: string | null;
  isPreparingDesign: boolean;
  targetUrl: string;
  sidebarScrolled: boolean;
  loadingStage: 'gathering' | 'planning' | 'generating' | null;
  isStartingNewGeneration: boolean;
  sandboxFiles: Record<string, string>;
  hasInitialSubmission: boolean;
  fileStructure: string;
  isMounted: boolean;
  conversationContext: ConversationContext;
  codeApplicationState: CodeApplicationState;
  generationProgress: GenerationProgress;
  shouldAutoGenerate: boolean;
  languageModel: LLMModelConfig;
  selectedTemplate: 'auto' | TemplateId;
  editingFile: { path: string; content: string; type: string } | null;
}

export const initialState: GenerationState = {
  sandboxData: null,
  loading: false,
  status: { text: 'Not connected', active: false },
  responseArea: [],
  structureContent: 'No sandbox created yet',
  promptInput: '',
  chatMessages: [
    {
      content: 'Welcome! I can help you generate code with full context of your sandbox files and structure. Just start chatting - I\'ll automatically create a sandbox for you if needed!\n\nTip: If you see package errors like "react-router-dom not found", just type "npm install" or "check packages" to automatically install missing packages.',
      type: 'system',
      timestamp: new Date()
    }
  ],
  aiChatInput: '',
  aiEnabled: true,
  aiModel: appConfig.ai.defaultModel, // This will be deprecated in favor of languageModel.model
  urlInput: '',
  urlStatus: [],
  showHomeScreen: true,
  expandedFolders: new Set(['app', 'src', 'src/components']),
  selectedFile: null,
  homeScreenFading: false,
  homeUrlInput: '',
  homeContextInput: '',
  activeTab: 'preview',
  selectedStyle: null,
  showLoadingBackground: false,
  urlScreenshot: null,
  isScreenshotLoaded: false,
  isCapturingScreenshot: false,
  screenshotError: null,
  isPreparingDesign: false,
  targetUrl: '',
  sidebarScrolled: false,
  loadingStage: null,
  isStartingNewGeneration: false,
  sandboxFiles: {},
  hasInitialSubmission: false,
  fileStructure: '',
  isMounted: false,
  conversationContext: {
    scrapedWebsites: [],
    generatedComponents: [],
    appliedCode: [],
    currentProject: '',
    lastGeneratedCode: undefined
  },
  codeApplicationState: {
    stage: null
  },
  generationProgress: {
    isGenerating: false,
    status: '',
    components: [],
    currentComponent: 0,
    streamedCode: '',
    isStreaming: false,
    isThinking: false,
    files: [],
    lastProcessedPosition: 0
  },
  shouldAutoGenerate: false,
  languageModel: { model: 'models/gemini-1.5-pro' },
  selectedTemplate: 'auto',
  editingFile: null,
};

export type GenerationAction =
  | { type: 'SET_STATE'; payload: Partial<GenerationState> }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'LOG_MESSAGE'; payload: { message: string; type: 'info' | 'error' | 'command' } }
  | { type: 'TOGGLE_FOLDER'; payload: string }
  | { type: 'SET_LANGUAGE_MODEL'; payload: Partial<LLMModelConfig> }
  | { type: 'SET_SELECTED_TEMPLATE'; payload: TemplateId | 'auto' };

const generationReducer: Reducer<GenerationState, GenerationAction> = (state, action) => {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, ...action.payload };
    case 'ADD_CHAT_MESSAGE':
      // Skip duplicate consecutive system messages
      if (action.payload.type === 'system' && state.chatMessages.length > 0) {
        const lastMessage = state.chatMessages[state.chatMessages.length - 1];
        if (lastMessage.type === 'system' && lastMessage.content === action.payload.content) {
          return state;
        }
      }
      return { ...state, chatMessages: [...state.chatMessages, action.payload] };
    case 'LOG_MESSAGE':
      return { ...state, responseArea: [...state.responseArea, `[${action.payload.type}] ${action.payload.message}`] };
    case 'TOGGLE_FOLDER':
      const newSet = new Set(state.expandedFolders);
      if (newSet.has(action.payload)) {
        newSet.delete(action.payload);
      } else {
        newSet.add(action.payload);
      }
      return { ...state, expandedFolders: newSet };
    case 'SET_LANGUAGE_MODEL':
      return { ...state, languageModel: { ...state.languageModel, ...action.payload } };
    case 'SET_SELECTED_TEMPLATE':
      return { ...state, selectedTemplate: action.payload };
    default:
      return state;
  }
};

export const useGenerationState = () => {
  return useReducer(generationReducer, initialState);
};
