'use client'

import { ViewType } from '@/components/auth'
import { AuthDialog } from '@/components/auth-dialog'
import { Chat } from '@/components/chat'
import { ChatInput } from '@/components/chat-input'
import { ChatPicker } from '@/components/chat-picker'
import { ChatSettings } from '@/components/chat-settings'
import { NavBar } from '@/components/navbar'
import { Preview } from '@/components/preview'
import { Sidebar } from '@/components/sidebar'
import { useAuth } from '@/lib/auth'
import { Project, createProject, saveMessage, getProjectMessages, generateProjectTitle, getProject } from '@/lib/database'
import { Message, toAISDKMessages, toMessageImage } from '@/lib/messages'
import { LLMModelConfig } from '@/lib/models'
import modelsList from '@/lib/models.json'
import { FragmentSchema, fragmentSchema as schema } from '@/lib/schema'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import templates, { TemplateId } from '@/lib/templates'
import { ExecutionResult } from '@/lib/types'
import { cn } from '@/lib/utils'
import { DeepPartial } from 'ai'
import { experimental_useObject as useObject } from 'ai/react'
import { usePostHog } from 'posthog-js/react'
import { SetStateAction, useCallback, useEffect, useState } from 'react'
import { useLocalStorage } from 'usehooks-ts'
import { useEnhancedChat } from '@/hooks/use-enhanced-chat'
import { useUserTeam } from '@/lib/user-team-provider'
import { HeroPillSecond } from '@/components/announcement'
import { useAnalytics } from '@/lib/analytics-service'

export default function Home() {
  const supabase = createSupabaseBrowserClient()
  const [chatInput, setChatInput] = useLocalStorage('chat', '')
  const [files, setFiles] = useState<File[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<'auto' | TemplateId>('auto')
  const [languageModel, setLanguageModel] = useLocalStorage<LLMModelConfig>(
    'languageModel',
    {
      model: 'claude-3-5-sonnet-latest',
    },
  )

  const posthog = usePostHog()
  const analytics = useAnalytics()

  const [result, setResult] = useState<ExecutionResult>()
  const [sessionStartTime] = useState(Date.now())
  const [fragmentsGenerated, setFragmentsGenerated] = useState(0)
  const [messagesCount, setMessagesCount] = useState(0)
  const [errorsEncountered, setErrorsEncountered] = useState(0)
  const [messages, setMessages] = useState<Message[]>([])
  const [fragment, setFragment] = useState<DeepPartial<FragmentSchema>>()
  const [currentTab, setCurrentTab] = useState<'code' | 'fragment' | 'terminal' | 'interpreter' | 'editor'>('code')
  const [selectedFile, setSelectedFile] = useState<{ path: string; content: string } | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [isAuthDialogOpen, setAuthDialog] = useState(false)
  const [authView, setAuthView] = useState<ViewType>('sign_in')
  const [isRateLimited, setIsRateLimited] = useState(false)
  const setAuthDialogCallback = useCallback((isOpen: boolean) => {
    setAuthDialog(isOpen)
  }, [setAuthDialog])

  const setAuthViewCallback = useCallback((view: ViewType) => {
    setAuthView(view)
  }, [setAuthView])
  const [errorMessage, setErrorMessage] = useState('')
  const [executionResult, setExecutionResult] = useState<ExecutionResult | undefined>(undefined)
  
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [isLoadingProject, setIsLoadingProject] = useState(false)

  const { session } = useAuth(setAuthDialogCallback, setAuthViewCallback)
  const { userTeam } = useUserTeam()


  const { executeCode: enhancedExecuteCode } = useEnhancedChat({
    userID: session?.user?.id,
    teamID: userTeam?.id,
    model: modelsList.models.find(m => m.id === languageModel.model)!,
    config: languageModel,
    template: templates,
  })

  const handleChatSelected = async (chatId: string) => {
    const project = await getProject(supabase, chatId);
    if (project) {
      setCurrentProject(project);
    }
  };

  const filteredModels = modelsList.models.filter((model) => {
    if (process.env.NEXT_PUBLIC_HIDE_LOCAL_MODELS) {
      return model.providerId !== 'ollama'
    }
    return true
  })

  const currentModel = filteredModels.find(
    (model) => model.id === languageModel.model,
  )
  const lastMessage = messages[messages.length - 1]


  const { object, submit, isLoading, stop, error } = useObject({
    api: '/api/chat',
    schema,
    onError: (error) => {
      console.error('Error submitting request:', error)
      
      let displayMessage = error.message
      let isRateLimit = false
      
      // Try to parse structured error response
      try {
        if (error.message.startsWith('{')) {
          const errorData = JSON.parse(error.message)
          displayMessage = errorData.error || error.message
          isRateLimit = errorData.type === 'rate_limit'
        } else {
          // Handle common error patterns
          if (error.message.includes('limit') || error.message.includes('rate')) {
            isRateLimit = true
            displayMessage = 'Rate limit exceeded. Please try again later or use your own API key.'
          } else if (error.message.includes('API key') || error.message.includes('unauthorized')) {
            displayMessage = 'Invalid API key. Please check your API key configuration in settings.'
          } else if (error.message.includes('network') || error.message.includes('fetch')) {
            displayMessage = 'Network error. Please check your connection and try again.'
          } else if (error.message.includes('timeout')) {
            displayMessage = 'Request timeout. Please try again.'
          }
        }
      } catch {
        // Use original error message if parsing fails
      }
      
      setIsRateLimited(isRateLimit)
      setErrorMessage(displayMessage)
    },
    onFinish: async ({ object: fragment, error }) => {
      if (!error) {
        setIsPreviewLoading(true)
        // Enhanced analytics tracking
        const generationTime = Date.now() - Date.now() // Would track actual generation time
        if (fragment) {
          analytics.trackFragmentGenerated(fragment, generationTime, 1)
        }
        setFragmentsGenerated(prev => prev + 1)
        
        // Additional revenue tracking handled by analytics service
        
        posthog.capture('fragment_generated', {
          template: fragment?.template,
        })

        const response = await fetch('/api/sandbox', {
          method: 'POST',
          body: JSON.stringify({
            fragment,
            userID: session?.user?.id,
            teamID: userTeam?.id,
            accessToken: session?.access_token,
          }),
        })

        const result = await response.json()
        
        if (!response.ok) {
          console.error('Sandbox creation failed:', result)
          setErrorMessage(result.error || 'Failed to create sandbox environment')
          setIsPreviewLoading(false)
          return
        }

        // Enhanced sandbox tracking
        const creationTime = Date.now() - Date.now() // Would track actual creation time
        analytics.trackSandboxCreation(fragment?.template || 'unknown', creationTime, response.ok)
        
        posthog.capture('sandbox_created', { url: result.url })

        setResult(result)
        setCurrentPreview({ fragment, result })
        setMessage({ result })
        setCurrentTab('fragment')
        setIsPreviewLoading(false)
      }
    },
  })

  useEffect(() => {
    async function loadProjectMessages() {
      if (!currentProject) {
        setMessages([])
        return
      }

      setIsLoadingProject(true)
      const projectMessages = await getProjectMessages(supabase, currentProject.id)
      setMessages(projectMessages)
      setIsLoadingProject(false)
    }

    loadProjectMessages()
  }, [currentProject, supabase])

  useEffect(() => {
    async function saveMessagesToDb() {
      if (!currentProject || !session || messages.length === 0) return

      const lastMessage = messages[messages.length - 1]
      const sequenceNumber = messages.length - 1

      await saveMessage(supabase, currentProject.id, lastMessage, sequenceNumber)
    }

    if (messages.length > 0 && currentProject && session) {
      saveMessagesToDb()
    }
  }, [messages, currentProject, session, supabase])

  useEffect(() => {
    if (object) {
      setFragment(object)
      const content: Message['content'] = [
        { type: 'text', text: object.commentary || '' },
        { type: 'code', text: object.code || '' },
      ]
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1]
        if (!lastMessage || lastMessage.role !== 'assistant') {
          return [
            ...prev,
            {
              role: 'assistant',
              content,
              object,
            },
          ]
        } else {
          const newMessages = [...prev]
          newMessages[prev.length - 1] = {
            ...lastMessage,
            content,
            object,
          }
          return newMessages
        }
      })
    }
  }, [object])

  useEffect(() => {
    if (error) stop()
  }, [error, stop])

  // Track session end when component unmounts
  useEffect(() => {
    return () => {
      if (session?.user?.id) {
        const sessionDuration = Date.now() - sessionStartTime
        analytics.trackSessionEnd(
          sessionDuration,
          fragmentsGenerated,
          messagesCount,
          errorsEncountered
        )
      }
    }
  }, [session?.user?.id, sessionStartTime, fragmentsGenerated, messagesCount, errorsEncountered, analytics])

  function setMessage(message: Partial<Message>, index?: number) {
    setMessages((previousMessages) => {
      const updatedMessages = [...previousMessages]
      updatedMessages[index ?? previousMessages.length - 1] = {
        ...previousMessages[index ?? previousMessages.length - 1],
        ...message,
      }
      return updatedMessages
    })
  }

  async function handleSubmitAuth(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!session) {
      return setAuthDialog(true)
    }

    if (isLoading) {
      stop()
    }

    const currentInput = chatInput
    const currentFiles = [...files]
    setChatInput('')
    setFiles([])
    setCurrentTab('code')

    const content: Message['content'] = [{ type: 'text', text: currentInput }]
    
    const images = await toMessageImage(currentFiles)
    if (images.length > 0) {
      images.forEach((image) => {
        content.push({ type: 'image', image })
      })
    }

    const newMessage: Message = {
      role: 'user',
      content,
    }
    const updatedMessages = [...messages, newMessage]
    setMessages(updatedMessages)

    const templateToSend =
      selectedTemplate === 'auto'
        ? templates
        : { [selectedTemplate]: templates[selectedTemplate] }

    submit({
      userID: session?.user?.id,
      teamID: userTeam?.id,
      messages: toAISDKMessages(updatedMessages),
      template: templateToSend,
      model: currentModel,
      config: languageModel,
    })

    if (!currentProject) {
      try {
        const title = await generateProjectTitle(currentInput)
        if (supabase) {
          const newProject = await createProject(supabase, title, selectedTemplate === 'auto' ? undefined : selectedTemplate)
          if (newProject) {
            setCurrentProject(newProject)
          }
        }
      } catch (error) {
        console.error('Error creating project:', error)
      }
    }

    // Enhanced chat analytics
    setMessagesCount(prev => prev + 1)
    
    const promptLength = currentInput.length
    const hasImages = currentFiles.length > 0
    
    analytics.trackPromptSubmission(
      currentInput,
      languageModel.model || 'unknown',
      promptLength,
      hasImages,
      messages.length > 0 ? 'conversation' : 'none'
    )
    
    // Track template selection
    if (selectedTemplate !== 'auto') {
      analytics.trackTemplateSelected(selectedTemplate, 'manual')
    }
    
    // Revenue tracking handled by analytics service
    
    posthog.capture('chat_submit', {
      template: selectedTemplate,
      model: languageModel.model,
    })
  }

  function retry() {
    submit({
      userID: session?.user?.id,
      teamID: userTeam?.id,
      messages: toAISDKMessages(messages),
      template: templates,
      model: currentModel,
      config: languageModel,
    })
  }

  const handleSaveInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setChatInput(e.target.value)
    },
    [setChatInput],
  )

  const handleFileChange = useCallback((change: SetStateAction<File[]>) => {
    setFiles(change)
  }, [])

  function logout() {
    if (supabase) {
      supabase.auth.signOut()
    } else {
      console.warn('Supabase is not initialized')
    }
  }

  function handleLanguageModelChange(e: LLMModelConfig) {
    const previousModel = languageModel.model
    const newModel = e.model
    
    if (previousModel && newModel && previousModel !== newModel) {
      // Track model switching
      analytics.trackModelSwitch(previousModel, newModel, 'experiment')
      
      // Revenue tracking handled by analytics service
    }
    
    setLanguageModel({ ...languageModel, ...e })
  }

  function handleSocialClick(target: 'github' | 'x' | 'discord') {
    if (target === 'github') {
      window.open('https://github.com/Gerome-Elassaad/CodingIT', '_blank')
    } else if (target === 'x') {
      window.open('https://x.com/codinit_dev', '_blank')
    } else if (target === 'discord') {
      window.open('https://discord.gg/', '_blank')
    }

    // Enhanced social tracking
    analytics.trackFeatureUsed(`social_${target}`, { target })
    
    posthog.capture(`${target}_click`)
  }

  function handleClearChat() {
    stop()
    setChatInput('')
    setFiles([])
    setMessages([])
    setFragment(undefined)
    setResult(undefined)
    setCurrentTab('code')
    setIsPreviewLoading(false)
    setCurrentProject(null)
  }

  function setCurrentPreview(preview: {
    fragment: DeepPartial<FragmentSchema> | undefined
    result: ExecutionResult | undefined
  }) {
    setFragment(preview.fragment)
    setResult(preview.result)
  }

  function handleUndo() {
    setMessages((previousMessages) => [...previousMessages.slice(0, -2)])
    setCurrentPreview({ fragment: undefined, result: undefined })
  }

  const executeCode = async (code: string) => {
    const startTime = Date.now()
    const result = await enhancedExecuteCode(code)
    const executionTime = Date.now() - startTime
    
    // Enhanced execution tracking
    if (session?.user?.id) {
      analytics.trackCodeExecution(
        `exec_${Date.now()}`,
        selectedTemplate === 'auto' ? 'unknown' : selectedTemplate,
        executionTime,
        !result.error,
        result.error ? 'execution_error' : undefined
      )
      
      // Revenue tracking handled by analytics service
      
      if (result.error) {
        setErrorsEncountered(prev => prev + 1)
      }
    }
    
    setExecutionResult(result)
  }

  return (
    <main className="flex flex-col min-h-screen max-h-screen">
      {supabase && (
        <AuthDialog
          open={isAuthDialogOpen}
          setOpen={setAuthDialog}
          view={authView}
          supabase={supabase}
        />
      )}

      {session && (
        <Sidebar
          userPlan={userTeam?.tier}
          onChatSelected={handleChatSelected}
        />
      )}

      <div className={cn(
        "grid w-full h-full md:grid-cols-2 transition-all duration-300 flex-grow",
        session ? "ml-16" : ""
      )}>
        <div
          className={`flex flex-col w-full h-full max-w-[800px] mx-auto px-4 overflow-auto ${fragment ? 'col-span-1' : 'col-span-2'}`}
        >
          <NavBar
            session={session}
            showLogin={() => setAuthDialog(true)}
            signOut={logout}
            onSocialClick={handleSocialClick}
            onClear={handleClearChat}
            canClear={messages.length > 0}
            canUndo={messages.length > 1 && !isLoading}
            onUndo={handleUndo}
          />
          
          <div className={cn('flex flex-col w-full flex-grow', messages.length === 0 ? 'items-center justify-center' : 'justify-end')}>
            {messages.length === 0 && !isLoadingProject ? (
              <div className="text-center px-4">
                <h1 className="text-4xl font-bold tracking-tight mb-4">
                  Build anything, fast.
                </h1>
                <p className="text-lg text-muted-foreground mb-8">
                  Tell CodinIT what you want to create, and it will build it for you.
                </p>
              </div>
            ) : (
              <Chat
                messages={messages}
                isLoading={isLoading}
                setCurrentPreview={setCurrentPreview}
                executeCode={executeCode}
              />
            )}
            
            <ChatInput
              className={cn('w-full', messages.length === 0 ? '' : 'mt-auto')}
              retry={retry}
              isErrored={error !== undefined}
            errorMessage={errorMessage}
            isLoading={isLoading}
            isRateLimited={isRateLimited}
            stop={stop}
            input={chatInput}
            handleInputChange={handleSaveInputChange}
            handleSubmit={handleSubmitAuth}
            isMultiModal={currentModel?.multiModal || false}
            files={files}
            handleFileChange={handleFileChange}
           >
            <ChatPicker
              templates={templates}
              selectedTemplate={selectedTemplate}
              onSelectedTemplateChange={setSelectedTemplate}
              models={filteredModels}
              languageModel={languageModel}
              onLanguageModelChange={handleLanguageModelChange}
            />
            <ChatSettings
              languageModel={languageModel}
              onLanguageModelChange={handleLanguageModelChange}
              apiKeyConfigurable={!process.env.NEXT_PUBLIC_NO_API_KEY_INPUT}
              baseURLConfigurable={!process.env.NEXT_PUBLIC_NO_BASE_URL_INPUT}
            />
          </ChatInput>
          </div>
        </div>
          <Preview
          teamID={userTeam?.id}
          accessToken={session?.access_token}
          selectedTab={currentTab}
          onSelectedTabChange={setCurrentTab}
          isChatLoading={isLoading}
          isPreviewLoading={isPreviewLoading}
          fragment={fragment}
          result={executionResult || result as ExecutionResult}
          onClose={() => setFragment(undefined)}
          code={fragment?.code || ''}
          executeCode={executeCode}
          selectedFile={selectedFile} onSave={function (path: string, content: string): void {
            throw new Error('Function not implemented.')
          } }        />
      </div>
    </main>
  )
}
