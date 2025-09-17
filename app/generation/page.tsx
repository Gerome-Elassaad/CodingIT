'use client';

import { useEffect, useRef, Suspense } from 'react';
import { Sidebar } from '@/components/sidebar';
import { useSearchParams, useRouter } from 'next/navigation';
import { appConfig } from '@/config/app.config';
import {
  FiChevronRight,
  FiChevronDown,
  BsFolderFill,
  BsFolder2Open,
} from '@/lib/icons';
import { useGenerationState, SandboxData } from '@/hooks/use-generation-state';
import { getFileIcon, startGeneration, reapplyLastGeneration, downloadZip } from '@/lib/generation-utils';
import { LLMModel, LLMModelConfig, getModels } from '@/lib/models';
import { sendChatMessage, applyGeneratedCode } from '@/lib/ai-service';
import templates, { Templates } from '@/lib/templates';
import { CoreMessage } from 'ai';
// Removed useChat import due to API incompatibility
import CodeApplicationProgress from '@/components/CodeApplicationProgress';
import { motion } from 'framer-motion';
import { PromptBox } from '@/components/prompt-box'; // Corrected import to PromptBox

function AISandboxPage() {
  const [state, dispatch] = useGenerationState();
  const {
    sandboxData,
    loading,
    structureContent,
    chatMessages,
    aiChatInput,
    aiEnabled,
    showHomeScreen,
    expandedFolders,
    selectedFile,
    homeUrlInput,
    homeContextInput,
    activeTab,
    urlScreenshot,
    isScreenshotLoaded,
    isCapturingScreenshot,
    screenshotError,
    isPreparingDesign,
    targetUrl,
    isStartingNewGeneration,
    hasInitialSubmission,
    isMounted,
    conversationContext,
    codeApplicationState,
    generationProgress,
    shouldAutoGenerate,
    languageModel,
    selectedTemplate,
  } = state;

  const searchParams = useSearchParams();
  const router = useRouter();

  const models: LLMModel[] = getModels();

  // Local helper to add chat messages to the state
  const addChatMessage = (content: string, type: 'user' | 'ai' | 'system' | 'file-update' | 'command' | 'error', metadata?: any) => {
    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: { content, type, timestamp: new Date(), metadata } });
  };

  // Removed useChat hook due to API incompatibility.
  // Chat messages will be managed manually.

  // Synchronize useChat messages with local chatMessages state
  // Removed this useEffect as useChat is no longer used.

  useEffect(() => {
    // Persist language model and selected template to local storage
    if (state.isMounted) {
      localStorage.setItem('languageModel', JSON.stringify(languageModel));
      localStorage.setItem('selectedTemplate', selectedTemplate);
    }
  }, [languageModel, selectedTemplate, state.isMounted]);

  useEffect(() => {
    const modelParam = searchParams?.get('model');
    if (modelParam && appConfig.ai.availableModels.includes(modelParam)) {
      dispatch({ type: 'SET_LANGUAGE_MODEL', payload: { model: modelParam } });
    }
  }, [searchParams, dispatch]);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const codeDisplayRef = useRef<HTMLDivElement>(null);

  const captureUrlScreenshot = async (url: string) => {
    dispatch({ type: 'SET_STATE', payload: { isCapturingScreenshot: true, screenshotError: null } });
    try {
      const response = await fetch(`https://s0.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=1024`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        dispatch({ type: 'SET_STATE', payload: { urlScreenshot: reader.result as string } });
      };
    } catch (error: any) {
      dispatch({ type: 'SET_STATE', payload: { screenshotError: error.message } });
    } finally {
      dispatch({ type: 'SET_STATE', payload: { isCapturingScreenshot: false } });
    }
  };

  const toggleFolder = (folderPath: string) => {
    dispatch({ type: 'TOGGLE_FOLDER', payload: folderPath });
  };

  const handleFileClick = (filePath: string) => {
    dispatch({ type: 'SET_STATE', payload: { selectedFile: filePath } });
  };

  useEffect(() => {
    dispatch({ type: 'SET_STATE', payload: { isMounted: true } });
  }, []);

  useEffect(() => {
    if (!state.isMounted) return;

    let sandboxCreated = false; // Track if sandbox was created in this effect

    const initializePage = async () => {
      // Prevent double execution in React StrictMode
      if (sandboxCreated) return;

      const urlParam = searchParams?.get('url');
      const templateParam = searchParams?.get('template');
      const detailsParam = searchParams?.get('details');

      // Retrieve from local storage
      const storedPrompt = localStorage.getItem('userPrompt');
      const storedChatSettings = localStorage.getItem('chatSettings');
      const storedTemplate = localStorage.getItem('selectedTemplate');

      // Then check session storage as fallback
      const storedUrl = urlParam || sessionStorage.getItem('targetUrl');
      const storedStyle = templateParam || sessionStorage.getItem('selectedStyle');
      const storedInstructions = sessionStorage.getItem('additionalInstructions');

      if (storedPrompt && storedChatSettings) {
        const chatSettings: LLMModelConfig = JSON.parse(storedChatSettings);
        dispatch({ type: 'SET_STATE', payload: { languageModel: chatSettings, selectedTemplate: (storedTemplate as any) || 'auto' } });
        
        // Mark that we have an initial submission
        dispatch({ type: 'SET_STATE', payload: { hasInitialSubmission: true } });
        
        // Clear local storage after reading
        localStorage.removeItem('userPrompt');
        localStorage.removeItem('chatSettings');
        localStorage.removeItem('selectedTemplate');
        
        // Send the chat message
        handleSendChatMessage(storedPrompt, chatSettings, storedTemplate || 'auto');
        
      } else if (storedUrl) {
        // Mark that we have an initial submission since we're loading with a URL
        dispatch({ type: 'SET_STATE', payload: { hasInitialSubmission: true } });

        // Clear sessionStorage after reading
        sessionStorage.removeItem('targetUrl');
        sessionStorage.removeItem('selectedStyle');
        sessionStorage.removeItem('additionalInstructions');
        // Note: Don't clear siteMarkdown here, it will be cleared when used

        // Set the values in the component state
        dispatch({ type: 'SET_STATE', payload: { homeUrlInput: storedUrl, selectedStyle: storedStyle || 'modern' } });

        // Add details to context if provided
        if (detailsParam) {
          dispatch({ type: 'SET_STATE', payload: { homeContextInput: detailsParam } });
        } else if (storedStyle && !urlParam) {
          // Only apply stored style if no screenshot URL is provided
          // This prevents unwanted style inheritance when using screenshot search
          const styleNames: Record<string, string> = {
            '1': 'Glassmorphism',
            '2': 'Neumorphism',
            '3': 'Brutalism',
            '4': 'Minimalist',
            '5': 'Dark Mode',
            '6': 'Gradient Rich',
            '7': '3D Depth',
            '8': 'Retro Wave',
            modern: 'Modern clean and minimalist',
            playful: 'Fun colorful and playful',
            professional: 'Corporate professional and sleek',
            artistic: 'Creative artistic and unique'
          };
          const styleName = styleNames[storedStyle] || storedStyle;
          let contextString = `${styleName} style design`;

          // Add additional instructions if provided
          if (storedInstructions) {
            contextString += `. ${storedInstructions}`;
          }

          dispatch({ type: 'SET_STATE', payload: { homeContextInput: contextString } });
        } else if (storedInstructions && !urlParam) {
          // Apply only instructions if no style but instructions are provided
          // and no screenshot URL is provided
          dispatch({ type: 'SET_STATE', payload: { homeContextInput: storedInstructions } });
        }

        // Skip the home screen and go directly to builder
        dispatch({ type: 'SET_STATE', payload: { showHomeScreen: false, homeScreenFading: false } });

        // Set flag to auto-trigger generation after component updates
        dispatch({ type: 'SET_STATE', payload: { shouldAutoGenerate: true } });

        // Also set autoStart flag for the effect
        sessionStorage.setItem('autoStart', 'true');
      }

      // Clear old conversation
      try {
        await fetch('/api/conversation-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'clear-old' })
        });
        console.log('[home] Cleared old conversation data on mount');
      } catch (error) {
        console.error('[ai-sandbox] Failed to clear old conversation:', error);
        addChatMessage('Failed to clear old conversation data.', 'error');
      }

      // Check if sandbox ID is in URL
      const sandboxIdParam = searchParams?.get('sandbox');

      dispatch({ type: 'SET_STATE', payload: { loading: true } });
      try {
        if (sandboxIdParam) {
          console.log('[home] Sandbox ID found in URL, checking status:', sandboxIdParam);
          checkSandboxStatus();
        } else {
          console.log('[home] No sandbox in URL, creating new sandbox automatically...');
          sandboxCreated = true;
          await createSandbox(true);
        }

        // If we have a URL from the home page, mark for automatic start
        if (storedUrl || storedPrompt) { // Also check for storedPrompt
          // We'll trigger the generation after the component is fully mounted
          // and the startGeneration function is defined
          sessionStorage.setItem('autoStart', 'true');
        }
      } catch (error) {
        console.error('[ai-sandbox] Failed to create or restore sandbox:', error);
        addChatMessage('Failed to create or restore sandbox.', 'error');
      } finally {
        dispatch({ type: 'SET_STATE', payload: { loading: false } });
      }
    };

    initializePage();
  }, [isMounted]);
  
  useEffect(() => {
    // Handle Escape key for home screen
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state.showHomeScreen) {
        dispatch({ type: 'SET_STATE', payload: { homeScreenFading: true } });
        setTimeout(() => {
          dispatch({ type: 'SET_STATE', payload: { showHomeScreen: false, homeScreenFading: false } });
        }, 500);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.showHomeScreen, dispatch]);
  
  // Start capturing screenshot if URL is provided on mount (from home screen)
  useEffect(() => {
    if (!state.showHomeScreen && state.homeUrlInput && !state.urlScreenshot && !state.isCapturingScreenshot) {
      let screenshotUrl = state.homeUrlInput.trim();
      if (!screenshotUrl.match(/^https?:\/\//i)) {
        screenshotUrl = 'https://' + screenshotUrl;
      }
      captureUrlScreenshot(screenshotUrl);
    }
  }, [state.showHomeScreen, state.homeUrlInput, state.urlScreenshot, state.isCapturingScreenshot]);

  // Auto-start generation if flagged
  useEffect(() => {
    const autoStart = sessionStorage.getItem('autoStart');
    if (autoStart === 'true' && !state.showHomeScreen && (state.homeUrlInput || state.aiChatInput)) {
      sessionStorage.removeItem('autoStart');
      // Small delay to ensure everything is ready
      setTimeout(() => {
        console.log('[generation] Auto-starting generation for URL/Prompt:', state.homeUrlInput || state.aiChatInput);
        if (state.aiChatInput) {
          handleSendChatMessage(); // Trigger chat message send for prompt
        } else {
          startGeneration(); // Trigger URL generation
        }
      }, 1000);
    }
  }, [state.showHomeScreen, state.homeUrlInput, state.aiChatInput]);


  useEffect(() => {
    // Only check sandbox status on mount if we don't already have sandboxData
    if (!state.sandboxData) {
      checkSandboxStatus();
    }
  }, [state.sandboxData]);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [state.chatMessages]);

  // Auto-trigger generation when flag is set (from home page navigation or prompt submission)
  useEffect(() => {
    if (state.shouldAutoGenerate && (state.homeUrlInput || state.aiChatInput) && !state.showHomeScreen) {
      // Reset the flag
      dispatch({ type: 'SET_STATE', payload: { shouldAutoGenerate: false } });
      
      // Trigger generation after a short delay to ensure everything is set up
      const timer = setTimeout(() => {
        console.log('[generation] Auto-triggering generation from URL params or prompt');
        if (state.aiChatInput) {
          handleSendChatMessage(); // Trigger chat message send for prompt
        } else {
          startGeneration(); // Trigger URL generation
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [state.shouldAutoGenerate, state.homeUrlInput, state.aiChatInput, state.showHomeScreen, dispatch]);

  const updateStatus = (text: string, active: boolean) => {
    dispatch({ type: 'SET_STATE', payload: { status: { text, active } } });
  };

  const log = (message: string, type: 'info' | 'error' | 'command' = 'info') => {
    dispatch({ type: 'LOG_MESSAGE', payload: { message, type } });
  };

  const checkAndInstallPackages = async () => {
    // This function is only called when user explicitly requests it
    // Don't show error if no sandbox - it's likely being created
    if (!state.sandboxData) {
      console.log('[checkAndInstallPackages] No sandbox data available yet');
      return;
    }
    
    // Vite error checking removed - handled by template setup
    addChatMessage('Checking packages... Sandbox is ready with Vite configuration.', 'system');
  };

  const checkSandboxStatus = async () => {
    try {
      const response = await fetch('/api/sandbox-status');
      const data = await response.json();
      
      if (data.active && data.healthy && data.sandboxData) {
        console.log('[checkSandboxStatus] Setting sandboxData from API:', data.sandboxData);
        dispatch({ type: 'SET_STATE', payload: { sandboxData: data.sandboxData } });
        updateStatus('Sandbox active', true);
      } else if (data.active && !data.healthy) {
        // Sandbox exists but not responding
        updateStatus('Sandbox not responding', false);
        // Keep existing sandboxData if we have it - don't clear it
      } else {
        // Only clear sandboxData if we don't already have it or if we're explicitly checking from a fresh state
        // This prevents clearing sandboxData during normal operation when it should persist
        if (!state.sandboxData) {
          console.log('[checkSandboxStatus] No existing sandboxData, clearing state');
          dispatch({ type: 'SET_STATE', payload: { sandboxData: null } });
          updateStatus('No sandbox', false);
        } else {
          // Keep existing sandboxData and just update status
          console.log('[checkSandboxStatus] Keeping existing sandboxData, sandbox inactive but data preserved');
          updateStatus('Sandbox status unknown', false);
        }
      }
    } catch (error) {
      console.error('Failed to check sandbox status:', error);
      // Only clear on error if we don't have existing sandboxData
      if (!state.sandboxData) {
        dispatch({ type: 'SET_STATE', payload: { sandboxData: null } });
        updateStatus('Error', false);
      } else {
        updateStatus('Status check failed', false);
      }
    }
  };

  const sandboxCreationRef = useRef<boolean>(false);
  
  const createSandbox = async (fromHomeScreen = false) => {
    // Prevent duplicate sandbox creation
    if (sandboxCreationRef.current) {
      console.log('[createSandbox] Sandbox creation already in progress, skipping...');
      return null;
    }
    
    sandboxCreationRef.current = true;
    console.log('[createSandbox] Starting sandbox creation...');
    dispatch({ type: 'SET_STATE', payload: { loading: true, showLoadingBackground: true, responseArea: [], screenshotError: null } });
    updateStatus('Creating sandbox...', false);
    
    try {
      const response = await fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fragment: {
            template: 'nextjs-developer',
            code: 'console.log("Hello, World!");',
            file_path: 'index.js',
            port: 3000,
            commentary: 'Initial sandbox creation',
            title: 'New Sandbox',
            description: 'A new sandbox for development',
            additional_dependencies: [],
            has_additional_dependencies: false,
            install_dependencies_command: '',
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => response.text());
        console.error('Error response from /api/sandbox:', errorData);
        const errorMessage = typeof errorData === 'object' && errorData.error ? errorData.error : 'Server returned an error';
        const errorDetails = typeof errorData === 'object' && errorData.details ? errorData.details : `Status: ${response.status}`;
        throw new Error(`API Error: ${errorMessage} (${errorDetails})`);
      }
      
      const data = await response.json();
      console.log('[createSandbox] Response data:', data);
      
      if (data.success) {
        global.activeSandbox = data;
        sandboxCreationRef.current = false; // Reset the ref on success
        console.log('[createSandbox] Setting sandboxData from creation:', data);
        dispatch({ type: 'SET_STATE', payload: { sandboxData: data } });
        updateStatus('Sandbox active', true);
        log('Sandbox created successfully!');
        log(`Sandbox ID: ${data.sandboxId}`);
        log(`URL: ${data.url}`);
        
        // Update URL with sandbox ID
        const newParams = new URLSearchParams(searchParams?.toString() || '');
        newParams.set('sandbox', data.sandboxId);
        newParams.set('model', state.languageModel.model!);
        router.push(`/generation?${newParams.toString()}`, { scroll: false });
        
        // Fade out loading background after sandbox loads
        setTimeout(() => {
          dispatch({ type: 'SET_STATE', payload: { showLoadingBackground: false } });
        }, 3000);
        
        if (data.structure) {
          displayStructure(data.structure);
        }
        
        // Fetch sandbox files after creation
        setTimeout(fetchSandboxFiles, 1000);
        
        // For Vercel sandboxes, Vite is already started during setupViteApp
        // No need to restart it immediately after creation
        // Only restart if there's an actual issue later
        console.log('[createSandbox] Sandbox ready with Vite server running');
        
        // Only add welcome message if not coming from home screen
        if (!fromHomeScreen) {
          addChatMessage(`Sandbox created! ID: ${data.sandboxId}. I now have context of your sandbox and can help you build your app. Just ask me to create components and I'll automatically apply them!

Tip: I automatically detect and install npm packages from your code imports (like react-router-dom, axios, etc.)`, 'system');
        }
        
        setTimeout(() => {
          if (iframeRef.current) {
            iframeRef.current.src = data.url;
          }
        }, 100);
        
        // Return the sandbox data so it can be used immediately
        return data;
      } else {
        console.error('[createSandbox] API returned success: false with data:', data); // Log full error data
        const errorMessage = data.error || 'Unknown API error';
        throw new Error(`Sandbox creation failed: ${errorMessage}`);
      }
    } catch (error: any) {
      console.error('[createSandbox] Error:', error);
      updateStatus('Error', false);
      log(`Failed to create sandbox: ${error.message}`, 'error');
      addChatMessage(`Failed to create sandbox: ${error.message}`, 'system');
      throw error;
    } finally {
      dispatch({ type: 'SET_STATE', payload: { loading: false } });
      sandboxCreationRef.current = false; // Reset the ref
    }
  };

  const displayStructure = (structure: any) => {
    if (typeof structure === 'object') {
      dispatch({ type: 'SET_STATE', payload: { structureContent: JSON.stringify(structure, null, 2) } });
    } else {
      dispatch({ type: 'SET_STATE', payload: { structureContent: structure || 'No structure available' } });
    }
  };


  const fetchSandboxFiles = async () => {
    if (!state.sandboxData) return;
    
    try {
      const response = await fetch('/api/get-sandbox-files', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          dispatch({ type: 'SET_STATE', payload: { sandboxFiles: data.files || {}, fileStructure: data.structure || '' } });
          console.log('[fetchSandboxFiles] Updated file list:', Object.keys(data.files || {}).length, 'files');
        }
      }
    } catch (error) {
      console.error('[fetchSandboxFiles] Error fetching files:', error);
    }
  };
  
  const renderMainContent = () => {
    if (activeTab === 'generation' && (generationProgress.isGenerating || generationProgress.files.length > 0)) {
      return (
        /* Generation Tab Content */
        <div className="absolute inset-0 flex overflow-hidden">
          {/* File Explorer - Hide during edits */}
          {!generationProgress.isEdit && (
            <div className="w-[250px] border-r border-border bg-card flex flex-col flex-shrink-0">
            <div className="p-4 bg-muted text-muted-foreground flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BsFolderFill style={{ width: '16px', height: '16px' }} />
                <span className="text-sm font-medium">Explorer</span>
              </div>
            </div>
            
            {/* File Tree */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
              <div className="text-sm">
                {/* Root app folder */}
                <div 
                  className="flex items-center gap-2 py-0.5 px-3 hover:bg-muted rounded cursor-pointer text-muted-foreground"
                  onClick={() => toggleFolder('app')}
                >
                  {state.expandedFolders.has('app') ? (
                    <FiChevronDown style={{ width: '16px', height: '16px' }} className="text-gray-600" />
                  ) : (
                    <FiChevronRight style={{ width: '16px', height: '16px' }} className="text-gray-600" />
                  )}
                  {state.expandedFolders.has('app') ? (
                    <BsFolder2Open style={{ width: '16px', height: '16px' }} className="text-blue-500" />
                  ) : (
                    <BsFolderFill style={{ width: '16px', height: '16px' }} className="text-blue-500" />
                  )}
                  <span className="font-medium text-foreground">app</span>
                </div>
                
                {state.expandedFolders.has('app') && (
                  <div className="ml-6">
                    {/* Group files by directory */}
                    {(() => {
                      const fileTree: { [key: string]: Array<{ name: string; edited?: boolean }> } = {};
                      
                      // Create a map of edited files
                      // const editedFiles = new Set(
                      //   generationProgress.files
                      //     .filter(f => f.edited)
                      //     .map(f => f.path)
                      // );
                      
                      // Process all files from generation progress
                      generationProgress.files.forEach(file => {
                        const parts = file.path.split('/');
                        const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
                        const fileName = parts[parts.length - 1];
                        
                        if (!fileTree[dir]) fileTree[dir] = [];
                        fileTree[dir].push({
                          name: fileName,
                          edited: file.edited || false
                        });
                      });
                      
                      return Object.entries(fileTree).map(([dir, files]) => (
                        <div key={dir} className="mb-1">
                          {dir && (
                            <div 
                              className="flex items-center gap-2 py-0.5 px-3 hover:bg-muted rounded cursor-pointer text-muted-foreground"
                              onClick={() => toggleFolder(dir)}
                            >
                              {state.expandedFolders.has(dir) ? (
                                <FiChevronDown style={{ width: '16px', height: '16px' }} className="text-gray-600" />
                              ) : (
                                <FiChevronRight style={{ width: '16px', height: '16px' }} className="text-gray-600" />
                              )}
                              {state.expandedFolders.has(dir) ? (
                                <BsFolder2Open style={{ width: '16px', height: '16px' }} className="text-yellow-600" />
                              ) : (
                                <BsFolderFill style={{ width: '16px', height: '16px' }} className="text-yellow-600" />
                              )}
                              <span className="text-muted-foreground">{dir.split('/').pop()}</span>
                            </div>
                          )}
                          {(!dir || state.expandedFolders.has(dir)) && (
                            <div className={dir ? 'ml-8' : ''}>
                              {files.sort((a, b) => a.name.localeCompare(b.name)).map(fileInfo => {
                                const fullPath = dir ? `${dir}/${fileInfo.name}` : fileInfo.name;
                                const isSelected = state.selectedFile === fullPath;
                                
                                return (
                                  <div 
                                    key={fullPath} 
                                    className={`flex items-center gap-2 py-0.5 px-3 rounded cursor-pointer transition-all ${
                                      isSelected 
                                        ? 'bg-primary text-primary-foreground' 
                                        : 'text-muted-foreground hover:bg-muted'
                                    }`}
                                    onClick={() => handleFileClick(fullPath)}
                                  >
                                    {getFileIcon(fileInfo.name)}
                                    <span className={`text-xs flex items-center gap-1 ${isSelected ? 'font-medium' : ''}`}>
                                      {fileInfo.name}
                                      {fileInfo.edited && (
                                        <span className={`text-[10px] px-1 rounded ${
                                          isSelected ? 'bg-primary/80' : 'bg-accent text-accent-foreground'
                                        }`}>✓</span>
                                      )}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
          )}
          
          {/* Code Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Thinking Mode Display - Only show during active generation */}
            {generationProgress.isGenerating && (generationProgress.isThinking || generationProgress.thinkingText) && (
              <div className="px-6 pb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-purple-600 font-medium flex items-center gap-2">
                    {generationProgress.isThinking ? (
                      <>
                        <div className="w-3 h-3 bg-purple-600 rounded-full animate-pulse" />
                        AI is thinking...
                      </>
                    ) : (
                      <>
                        <span className="text-purple-600">✓</span>
                        Thought for {generationProgress.thinkingDuration || 0} seconds
                      </>
                    )}
                  </div>
                </div>
                {generationProgress.thinkingText && (
                  <div className="bg-secondary border border-secondary-border rounded-lg p-4 max-h-48 overflow-y-auto scrollbar-hide">
                    <pre className="text-xs font-mono text-secondary-foreground whitespace-pre-wrap">
                      {generationProgress.thinkingText}
                    </pre>
                  </div>
                )}
              </div>
            )}
            
            {/* Live Code Display */}
            <div className="flex-1 rounded-lg p-6 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide" ref={codeDisplayRef}>
                {/* Show selected file if one is selected */}
                {selectedFile ? (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                      <div className="px-4 py-2 bg-primary text-primary-foreground flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getFileIcon(selectedFile)}
                          <span className="font-mono text-sm">{selectedFile}</span>
                        </div>
                        <button
                          onClick={() => dispatch({ type: 'SET_STATE', payload: { selectedFile: null } })}
                          className="hover:bg-primary/80 p-1 rounded transition-colors"
                        >
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="bg-secondary border border-secondary-border rounded">
                        <pre>
                          <code>
                            {(() => {
                              // Find the file content from generated files
                              const file = generationProgress.files.find(f => f.path === selectedFile);
                              return file?.content || '// File content will appear here';
                            })()}
                          </code>
                        </pre>
                      </div>
                    </div>
                  </div>
                ) : /* If no files parsed yet, show loading or raw stream */
                generationProgress.files.length === 0 && !generationProgress.currentFile ? (
                  generationProgress.isThinking ? (
                    // Beautiful loading state while thinking
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="mb-8 relative">
                          <div className="w-24 h-24 mx-auto">
                            <div className="absolute inset-0 border-4 border-secondary rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-primary rounded-full animate-spin border-t-transparent"></div>
                          </div>
                        </div>
                        <h3 className="text-xl font-medium text-foreground mb-2">AI is analyzing your request</h3>
                        <p className="text-muted-foreground text-sm">{generationProgress.status || 'Preparing to generate code...'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-card border border-border rounded-lg overflow-hidden">
                      <div className="px-4 py-2 bg-muted text-muted-foreground flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <span className="font-mono text-sm">Streaming code...</span>
                        </div>
                      </div>
                      <div className="p-4 bg-secondary rounded">
                        <pre>
                          <code>
                            {generationProgress.streamedCode || 'Starting code generation...'}
                          </code>
                        </pre>
                        <span className="inline-block w-3 h-5 bg-primary ml-1 animate-pulse" />
                      </div>
                    </div>
                  )
                ) : (
                  <div className="space-y-4">
                    {/* Show current file being generated */}
                    {generationProgress.currentFile && (
                      <div className="bg-card border-2 border-border rounded-lg overflow-hidden shadow-sm">
                        <div className="px-4 py-2 bg-primary text-primary-foreground flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                            <span className="font-mono text-sm">{generationProgress.currentFile.path}</span>
                            <span className={`px-2 py-0.5 text-xs rounded ${
                              generationProgress.currentFile.type === 'css' ? 'bg-blue-600 text-white' :
                              generationProgress.currentFile.type === 'javascript' ? 'bg-yellow-600 text-white' :
                              generationProgress.currentFile.type === 'json' ? 'bg-green-600 text-white' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {generationProgress.currentFile.type === 'javascript' ? 'JSX' : generationProgress.currentFile.type.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="bg-secondary border border-secondary-border rounded">
                          <pre>
                            <code>
                              {generationProgress.currentFile.content}
                            </code>
                          </pre>
                          <span className="inline-block w-3 h-4 bg-primary ml-4 mb-4 animate-pulse" />
                        </div>
                      </div>
                    )}
                    
                    {/* Show completed files */}
                    {generationProgress.files.map((file, idx) => (
                      <div key={idx} className="bg-card border border-border rounded-lg overflow-hidden">
                        <div className="px-4 py-2 bg-primary text-primary-foreground flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            <span className="font-mono text-sm">{file.path}</span>
                          </div>
                          <span className={`px-2 py-0.5 text-xs rounded ${
                            file.type === 'css' ? 'bg-blue-600 text-white' :
                            file.type === 'javascript' ? 'bg-yellow-600 text-white' :
                            file.type === 'json' ? 'bg-green-600 text-white' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {file.type === 'javascript' ? 'JSX' : file.type.toUpperCase()}
                          </span>
                        </div>
                        <div className="bg-secondary border border-secondary-border  max-h-48 overflow-y-auto scrollbar-hide">
                          <pre>
                            <code>
                              {file.content}
                            </code>
                          </pre>
                        </div>
                      </div>
                    ))}
                    
                    {/* Show remaining raw stream if there's content after the last file */}
                    {!generationProgress.currentFile && generationProgress.streamedCode.length > 0 && (
                      <div className="bg-card border border-border rounded-lg overflow-hidden">
                        <div className="px-4 py-2 bg-primary text-primary-foreground flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-border border-t-transparent rounded-full animate-spin" />
                            <span className="font-mono text-sm">Processing...</span>
                          </div>
                        </div>
                        <div className="bg-secondary border border-secondary-border rounded">
                          <pre>
                            <code>
                              {(() => {
                                // Show only the tail of the stream after the last file
                                const lastFileEnd = generationProgress.files.length > 0 
                                  ? generationProgress.streamedCode.lastIndexOf('</file>') + 7
                                  : 0;
                                let remainingContent = generationProgress.streamedCode.slice(lastFileEnd).trim();
                                
                                // Remove explanation tags and content
                                remainingContent = remainingContent.replace(/<explanation>[\s\S]*?<\/explanation>/g, '').trim();
                                
                                // If only whitespace or nothing left, show waiting message
                                return remainingContent || 'Waiting for next file...';
                              })()}
                            </code>
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Progress indicator */}
            {generationProgress.components.length > 0 && (
              <div className="mx-6 mb-6">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300"
                    style={{
                      width: `${(generationProgress.currentComponent / Math.max(generationProgress.components.length, 1)) * 100}%`
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      );
    } else if (activeTab === 'preview') {
      // Show loading state for initial generation or when starting a new generation with existing sandbox
      const isInitialGeneration = !state.sandboxData?.url && (state.urlScreenshot || state.isCapturingScreenshot || state.isPreparingDesign || state.loadingStage);
      const isNewGenerationWithSandbox = state.isStartingNewGeneration && state.sandboxData?.url;
      const shouldShowLoadingOverlay = (isInitialGeneration || isNewGenerationWithSandbox) && 
        (state.loading || state.generationProgress.isGenerating || state.isPreparingDesign || state.loadingStage || state.isCapturingScreenshot || state.isStartingNewGeneration);
      
      if (isInitialGeneration || isNewGenerationWithSandbox) {
        return (
          <div className="relative w-full h-full bg-background">
            {/* Screenshot as background when available */}
            {state.urlScreenshot && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img 
                src={state.urlScreenshot} 
                alt="Website preview" 
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
                style={{ 
                  opacity: state.isScreenshotLoaded ? 1 : 0,
                  willChange: 'opacity'
                }}
                onLoad={() => dispatch({ type: 'SET_STATE', payload: { isScreenshotLoaded: true } })}
                loading="eager"
              />
            )}
            
            {/* Loading overlay - only show when actively processing initial generation */}
            {shouldShowLoadingOverlay && (
              <div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center backdrop-blur-sm">
                {/* Loading animation with skeleton */}
                <div className="text-center max-w-md">
                  {/* Animated skeleton lines */}
                  <div className="mb-6 space-y-3">
                    <div className="h-2 bg-gradient-to-r from-transparent via-foreground/20 to-transparent rounded animate-pulse" 
                         style={{ animationDuration: '1.5s', animationDelay: '0s' }} />
                    <div className="h-2 bg-gradient-to-r from-transparent via-foreground/20 to-transparent rounded animate-pulse w-4/5 mx-auto" 
                         style={{ animationDuration: '1.5s', animationDelay: '0.2s' }} />
                    <div className="h-2 bg-gradient-to-r from-transparent via-foreground/20 to-transparent rounded animate-pulse w-3/5 mx-auto" 
                         style={{ animationDuration: '1.5s', animationDelay: '0.4s' }} />
                  </div>
                  
                  {/* Spinner */}
                  <div className="w-12 h-12 border-3 border-foreground/30 border-t-foreground rounded-full animate-spin mx-auto mb-4" />
                  
                  {/* Status text */}
                  <p className="text-foreground text-lg font-medium">
                    {state.isCapturingScreenshot ? 'Analyzing website...' :
                     state.isPreparingDesign ? 'Preparing design...' :
                     state.generationProgress.isGenerating ? 'Generating code...' :
                     'Loading...'}
                  </p>
                  
                  {/* Subtle progress hint */}
                  <p className="text-muted-foreground text-sm mt-2">
                    {state.isCapturingScreenshot ? 'Taking a screenshot of the site' :
                     state.isPreparingDesign ? 'Understanding the layout and structure' :
                     state.generationProgress.isGenerating ? 'Writing React components' :
                     'Please wait...'}
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      }
      
      // Show sandbox iframe - keep showing during edits, only hide during initial loading
      if (state.sandboxData?.url) {
        return (
          <div className="relative w-full h-full">
            <iframe
              ref={iframeRef}
              src={state.sandboxData.url}
              className="w-full h-full border-none"
              title="Open Lovable Sandbox"
              allow="clipboard-write"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
            
            {/* Package installation overlay - shows when installing packages or applying code */}
            {codeApplicationState.stage && codeApplicationState.stage !== 'complete' && (
              <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="text-center max-w-md">
                  <div className="mb-6">
                    {/* Animated icon based on stage */}
                    {codeApplicationState.stage === 'installing' ? (
                      <div className="w-16 h-16 mx-auto">
                        <svg className="w-full h-full animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    ) : null}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {codeApplicationState.stage === 'analyzing' && 'Analyzing code...'}
                    {codeApplicationState.stage === 'installing' && 'Installing packages...'}
                    {codeApplicationState.stage === 'applying' && 'Applying changes...'}
                  </h3>
                  
                  {/* Package list during installation */}
                  {codeApplicationState.stage === 'installing' && codeApplicationState.packages && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2 justify-center">
                        {codeApplicationState.packages.map((pkg, index) => (
                          <span 
                            key={index}
                            className={`px-2 py-1 text-xs rounded-full transition-all ${
                              codeApplicationState.installedPackages?.includes(pkg)
                                ? 'bg-green-100 text-green-700'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {pkg}
                            {codeApplicationState.installedPackages?.includes(pkg) && (
                              <span className="ml-1">✓</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Files being generated */}
                  {codeApplicationState.stage === 'applying' && codeApplicationState.filesGenerated && (
                    <div className="text-sm text-muted-foreground">
                      Creating {codeApplicationState.filesGenerated.length} files...
                    </div>
                  )}
                  
                  <p className="text-sm text-muted-foreground mt-2">
                    {codeApplicationState.stage === 'analyzing' && 'Parsing generated code and detecting dependencies...'}
                    {codeApplicationState.stage === 'installing' && 'This may take a moment while npm installs the required packages...'}
                    {codeApplicationState.stage === 'applying' && 'Writing files to your sandbox environment...'}
                  </p>
                </div>
              </div>
            )}
            
            {/* Show a subtle indicator when code is being edited/generated */}
            {generationProgress.isGenerating && generationProgress.isEdit && !codeApplicationState.stage && (
              <div className="absolute top-4 right-4 inline-flex items-center gap-2 px-3 py-1.5 bg-secondary/80 backdrop-blur-sm rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-secondary-foreground text-xs font-medium">Generating code...</span>
              </div>
            )}
            
            {/* Refresh button */}
            <button
              onClick={() => {
                if (iframeRef.current && state.sandboxData?.url) {
                  console.log('[Manual Refresh] Forcing iframe reload...');
                  const newSrc = `${state.sandboxData.url}?t=${Date.now()}&manual=true`;
                  iframeRef.current.src = newSrc;
                }
              }}
              className="absolute bottom-4 right-4 bg-card/90 hover:bg-card text-card-foreground p-2 rounded-lg shadow-lg transition-all duration-200 hover:scale-105"
              title="Refresh sandbox"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        );
      }
      
      // Default state when no sandbox and no screenshot
      return (
        <div className="flex items-center justify-center h-full bg-muted text-muted-foreground text-lg">
          {state.screenshotError ? (
            <div className="text-center">
              <p className="mb-2">Failed to capture screenshot</p>
              <p className="text-sm text-muted-foreground">{state.screenshotError}</p>
            </div>
          ) : state.sandboxData ? (
            <div className="text-muted-foreground">
              <div className="w-8 h-8 border-2 border-border border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm">Loading preview...</p>
            </div>
          ) : (
            <div className="text-muted-foreground text-center">
              <p className="text-sm">Start chatting to create your first app</p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const handleSendChatMessage = async (initialPrompt?: string, initialSettings?: LLMModelConfig, initialTemplateId?: string) => {
    const message = initialPrompt || state.aiChatInput.trim();
    if (!message) return;

    if (!state.aiEnabled) {
      addChatMessage('AI is disabled. Please enable it first.', 'system');
      return;
    }

    addChatMessage(message, 'user');
    dispatch({ type: 'SET_STATE', payload: { aiChatInput: '' } });

    const templateToSend =
      initialTemplateId === 'auto'
        ? templates
        : ({ [initialTemplateId || state.selectedTemplate]: templates[initialTemplateId as keyof typeof templates || state.selectedTemplate] } as Templates);

    const coreMessages: CoreMessage[] = state.chatMessages
      .filter(m => m.type === 'user' || m.type === 'ai' || m.type === 'system')
      .map(m => ({
        role: m.type === 'ai' ? 'assistant' : m.type as 'user' | 'assistant' | 'system',
        content: m.content,
      }));

    coreMessages.push({ role: 'user', content: message });

    try {
      const body = await sendChatMessage(
        coreMessages,
        templateToSend,
        initialSettings?.model || state.languageModel.model!,
        initialSettings || state.languageModel
      );

      if (!body) {
        throw new Error('Response body is null');
      }

      const reader = body.getReader();
      const decoder = new TextDecoder();
      let streamedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        streamedContent += chunk;
      }

      try {
        const parsedResponse = JSON.parse(streamedContent);
        if (parsedResponse.content) {
          addChatMessage(parsedResponse.content, 'ai');
        } else {
          addChatMessage('Received a partial or unexpected response from AI.', 'error');
        }
      } catch (e) {
        addChatMessage('Failed to parse AI response.', 'error');
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      addChatMessage(`Error sending message: ${error.message}`, 'error');
    }

    // Check for special commands
    const lowerMessage = message.toLowerCase().trim();
    if (lowerMessage === 'check packages' || lowerMessage === 'install packages' || lowerMessage === 'npm install') {
      if (!state.sandboxData) {
        addChatMessage('The sandbox is still being set up. Please wait for the generation to complete, then try again.', 'system');
        return;
      }
      await checkAndInstallPackages();
      return;
    }

    if (!state.sandboxData) {
      addChatMessage('Creating sandbox while I plan your app...', 'system');
      try {
        await createSandbox(true);
      } catch (error: any) {
        addChatMessage(`Failed to create sandbox: ${error.message}`, 'system');
        throw error;
      }
    }

    const isEdit = state.conversationContext.appliedCode.length > 0;

    dispatch({
      type: 'SET_STATE',
      payload: {
        generationProgress: {
          ...state.generationProgress,
          isGenerating: true,
          status: 'Starting AI generation...',
          components: [],
          currentComponent: 0,
          streamedCode: '',
          isStreaming: false,
          isThinking: true,
          thinkingText: 'Analyzing your request...',
          thinkingDuration: undefined,
          currentFile: undefined,
          lastProcessedPosition: 0,
          isEdit: isEdit,
          files: state.generationProgress.files
        }
      }
    });
  };

  return (
    <div className="flex h-screen font-sans bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-card py-[8px] border-b border-border flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => createSandbox()}
              className="p-2 rounded-lg transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80 border"
              title="Create new sandbox"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button 
              onClick={() => reapplyLastGeneration(state.conversationContext, applyGeneratedCode)}
              className="p-2 rounded-lg transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80 border disabled:opacity-50 disabled:cursor-not-allowed"
              title="Re-apply last generation"
              disabled={!state.conversationContext.lastGeneratedCode || !state.sandboxData}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button 
              onClick={() => downloadZip(state.sandboxData)}
              disabled={!state.sandboxData}
              className="p-2 rounded-lg transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80 border disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download your Vite app as ZIP"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Center Panel - AI Chat (1/3 of remaining width) */}
          <div className="flex-1 max-w-[400px] flex flex-col border-r border-border bg-card">
          {/* Sidebar Input Component */}
          {!state.hasInitialSubmission ? (
            <div className="p-4 border-b border-border">
            </div>
          ) : null}

          {state.conversationContext.scrapedWebsites.length > 0 && (
            <div className="p-4 bg-card border-b border-border">
              <div className="flex flex-col gap-4">
                {state.conversationContext.scrapedWebsites.map((site, idx) => {
                  // Extract favicon and site info from the scraped data
                  const metadata = site.content?.metadata || {};
                  const sourceURL = metadata.sourceURL || site.url;
                  const favicon = metadata.favicon || `https://www.google.com/s2/favicons?domain=${new URL(sourceURL).hostname}&sz=128`;
                  const siteName = metadata.ogSiteName || metadata.title || new URL(sourceURL).hostname;
                  const screenshot = site.content?.screenshot || sessionStorage.getItem('websiteScreenshot');
                  
                  return (
                    <div key={idx} className="flex flex-col gap-3">
                      {/* Site info with favicon */}
                      <div className="flex items-center gap-4 text-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={favicon} 
                          alt={siteName}
                          className="w-16 h-16 rounded"
                          onError={(e) => {
                            e.currentTarget.src = `https://www.google.com/s2/favicons?domain=${new URL(sourceURL).hostname}&sz=128`;
                          }}
                        />
                        <a 
                          href={sourceURL} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-foreground hover:text-muted-foreground truncate max-w-[250px] font-medium"
                          title={sourceURL}
                        >
                          {siteName}
                        </a>
                      </div>
                      
                      {/* Pinned screenshot */}
                      {screenshot && (
                        <div 
                          className="w-full rounded-lg overflow-hidden border border-border transition-all duration-300"
                          style={{ 
                            opacity: state.sidebarScrolled ? 0 : 1,
                            transform: state.sidebarScrolled ? 'translateY(-20px)' : 'translateY(0)',
                            pointerEvents: state.sidebarScrolled ? 'none' : 'auto',
                            maxHeight: state.sidebarScrolled ? '0' : '200px'
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={screenshot}
                            alt={`${siteName} preview`}
                            className="w-full h-auto object-cover"
                            style={{ maxHeight: '200px' }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div 
            className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 scrollbar-hide" 
            ref={chatMessagesRef}
            onScroll={(e) => {
              const scrollTop = e.currentTarget.scrollTop;
              dispatch({ type: 'SET_STATE', payload: { sidebarScrolled: scrollTop > 50 } });
            }}>
            {state.chatMessages.map((msg, idx) => {
              // Check if this message is from a successful generation
              const isGenerationComplete = msg.content.includes('Successfully recreated') || 
                                         msg.content.includes('AI recreation generated!') ||
                                         msg.content.includes('Code generated!');
              
              // Get the files from metadata if this is a completion message
              // const completedFiles = msg.metadata?.appliedFiles || [];
              
              return (
                <div key={idx} className="block">
                  <div className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className="block">
                      <div className={`block rounded-[10px] px-14 py-8 ${
                        msg.type === 'user' ? 'bg-primary text-primary-foreground ml-auto max-w-[80%]' :
                        msg.type === 'ai' ? 'bg-muted text-muted-foreground mr-auto max-w-[80%]' :
                        msg.type === 'system' ? 'bg-info text-info-foreground text-sm' :
                        msg.type === 'command' ? 'bg-secondary text-secondary-foreground font-mono text-sm' :
                        msg.type === 'error' ? 'bg-destructive text-destructive-foreground text-sm border border-destructive' :
                        'bg-primary text-primary-foreground text-sm'
                      }`}>
                    {msg.type === 'command' ? (
                      <div className="flex items-start gap-2">
                        <span className={`text-xs ${
                          msg.metadata?.commandType === 'input' ? 'text-blue-400' :
                          msg.metadata?.commandType === 'error' ? 'text-red-400' :
                          msg.metadata?.commandType === 'success' ? 'text-green-400' :
                          'text-gray-400'
                        }`}>
                          {msg.metadata?.commandType === 'input' ? '$' : '>'}
                        </span>
                        <span className="flex-1 whitespace-pre-wrap text-white">{msg.content}</span>
                      </div>
                    ) : msg.type === 'error' ? (
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-red-800 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold mb-1">Build Errors Detected</div>
                          <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                          <div className="mt-2 text-xs opacity-70">Press 'F' or click the Fix button above to resolve</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-body-input">{msg.content}</span>
                    )}
                  </div>

                  {/* Show applied files if this is an apply success message */}
                  {msg.metadata?.appliedFiles && msg.metadata.appliedFiles.length > 0 && (
                    <div className="mt-3 inline-block bg-muted rounded-[10px] p-5">
                      <div className="text-xs font-medium mb-3 text-muted-foreground">
                        {msg.content.includes('Applied') ? 'Files Updated:' : 'Generated Files:'}
                      </div>
                      <div className="flex flex-wrap items-start gap-2">
                        {msg.metadata.appliedFiles.map((filePath, fileIdx) => {
                          const fileName = filePath.split('/').pop() || filePath;
                          const fileExt = fileName.split('.').pop() || '';
                          const fileType = fileExt === 'jsx' || fileExt === 'js' ? 'javascript' :
                                          fileExt === 'css' ? 'css' :
                                          fileExt === 'json' ? 'json' : 'text';
                          
                          return (
                            <div
                              key={`applied-${fileIdx}`}
                              className="inline-flex items-center gap-1.5 px-6 py-1.5 bg-primary text-primary-foreground rounded-[10px] text-xs animate-fade-in-up"
                              style={{ animationDelay: `${fileIdx * 30}ms` }}
                            >
                              <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                                fileType === 'css' ? 'bg-blue-400' :
                                fileType === 'javascript' ? 'bg-yellow-400' :
                                fileType === 'json' ? 'bg-green-400' :
                                'bg-gray-400'
                              }`} />
                              {fileName}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                      {/* Show generated files for completion messages - but only if no appliedFiles already shown */}
                      {isGenerationComplete && state.generationProgress.files.length > 0 && idx === state.chatMessages.length - 1 && !msg.metadata?.appliedFiles && !state.chatMessages.some(m => m.metadata?.appliedFiles) && (
                    <div className="mt-2 inline-block bg-muted rounded-[10px] p-3">
                      <div className="text-xs font-medium mb-1 text-muted-foreground">Generated Files:</div>
                      <div className="flex flex-wrap items-start gap-1">
                        {state.generationProgress.files.map((file, fileIdx) => (
                          <div
                            key={`complete-${fileIdx}`}
                            className="inline-flex items-center gap-1.5 px-6 py-1.5 bg-primary text-primary-foreground rounded-[10px] text-xs animate-fade-in-up"
                            style={{ animationDelay: `${fileIdx * 30}ms` }}
                          >
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                              file.type === 'css' ? 'bg-blue-400' :
                              file.type === 'javascript' ? 'bg-yellow-400' :
                              file.type === 'json' ? 'bg-green-400' :
                              'bg-gray-400'
                            }`} />
                            {file.path.split('/').pop()}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                    </div>
                    </div>
                  </div>
              );
            })}
            
            {/* Code application progress */}
            {codeApplicationState.stage && (
              <CodeApplicationProgress state={codeApplicationState} />
            )}
            
            {/* File generation progress - inline display (during generation) */}
            {generationProgress.isGenerating && (
              <div className="inline-block bg-muted rounded-lg p-3">
                <div className="text-sm font-medium mb-2 text-muted-foreground">
                  {generationProgress.status}
                </div>
                <div className="flex flex-wrap items-start gap-1">
                  {/* Show completed files */}
                  {generationProgress.files.map((file, idx) => (
                    <div
                      key={`file-${idx}`}
                      className="inline-flex items-center gap-1.5 px-6 py-1.5 bg-primary text-primary-foreground rounded-[10px] text-xs animate-fade-in-up"
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                      {file.path.split('/').pop()}
                    </div>
                  ))}
                  
                  {/* Show current file being generated */}
                  {generationProgress.currentFile && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-primary/70 text-primary-foreground rounded-[10px] text-xs animate-pulse"
                      style={{ animationDelay: `${generationProgress.files.length * 30}ms` }}>
                      <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      {generationProgress.currentFile.path.split('/').pop()}
                    </div>
                  )}
                </div>
                
                {/* Live streaming response display */}
                {generationProgress.streamedCode && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-3 border-t border-border pt-3"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs font-medium text-muted-foreground">AI Response Stream</span>
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
                    </div>
                    <div className="bg-secondary border border-secondary-border rounded max-h-128 overflow-y-auto scrollbar-hide">
                      <pre>
                        <code>
                          {(() => {
                            const lastContent = generationProgress.streamedCode.slice(-1000);
                            // Show the last part of the stream, starting from a complete tag if possible
                            const startIndex = lastContent.indexOf('<');
                            return startIndex !== -1 ? lastContent.slice(startIndex) : lastContent;
                          })()}
                        </code>
                      </pre>
                      <span className="inline-block w-3 h-4 bg-orange-400 ml-3 mb-3 animate-pulse" />
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          <div>
            <PromptBox
              aiChatInput={state.aiChatInput}
              setAiChatInput={(value) => dispatch({ type: 'SET_STATE', payload: { aiChatInput: value } })}
              sendChatMessage={handleSendChatMessage}
              isGenerating={state.generationProgress.isGenerating} // Use local state for loading
              languageModel={state.languageModel}
              onLanguageModelChange={(payload) => dispatch({ type: 'SET_LANGUAGE_MODEL', payload })}
            />
        </div>
      </div>

        {/* Right Panel - Preview or Generation (2/3 of remaining width) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-3 pt-4 pb-4 bg-card border-b border-border flex justify-between items-center">
            <div className="flex items-center gap-2">
              {/* Toggle-style Code/View switcher */}
              <div className="inline-flex bg-muted border border-border rounded-md p-0.5">
                <button
                  onClick={() => dispatch({ type: 'SET_STATE', payload: { activeTab: 'generation' } })}
                  className={`px-3 py-1 rounded transition-all text-xs font-medium ${
                    state.activeTab === 'generation' 
                      ? 'bg-background text-foreground shadow-sm' 
                      : 'bg-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    <span>Code</span>
                  </div>
                </button>
                <button
                  onClick={() => dispatch({ type: 'SET_STATE', payload: { activeTab: 'preview' } })}
                  className={`px-3 py-1 rounded transition-all text-xs font-medium ${
                    state.activeTab === 'preview' 
                      ? 'bg-background text-foreground shadow-sm' 
                      : 'bg-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>View</span>
                  </div>
                </button>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              {/* Files generated count */}
              {state.activeTab === 'generation' && !state.generationProgress.isEdit && state.generationProgress.files.length > 0 && (
                <div className="text-muted-foreground text-xs font-medium">
                  {state.generationProgress.files.length} files generated
                </div>
              )}
              
              {/* Live Code Generation Status */}
              {state.activeTab === 'generation' && state.generationProgress.isGenerating && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted border border-border rounded-md text-xs font-medium text-muted-foreground">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  {state.generationProgress.isEdit ? 'Editing code' : 'Live generation'}
                </div>
              )}
              
              {/* Sandbox Status Indicator */}
              {state.sandboxData && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted border border-border rounded-md text-xs font-medium text-muted-foreground">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Sandbox active
                </div>
              )}
              
              {/* Open in new tab button */}
              {state.sandboxData && (
                <a 
                  href={state.sandboxData.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  title="Open in new tab"
                  className="p-1.5 rounded-md transition-all text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          </div>
          <div className="flex-1 relative overflow-hidden">
            {renderMainContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <AISandboxPage />
    </Suspense>
  );
}
