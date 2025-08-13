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
import { HeroPillSecond } from '@/components/announcement'
import templatesData from '@/lib/templates'
import { API_BASE_URL } from '@/lib/config'

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

  const [result, setResult] = useState<ExecutionResult>()
  const [messages, setMessages] = useState<Message[]>([])
  const [fragment, setFragment] = useState<DeepPartial<FragmentSchema>>()
  const [currentTab, setCurrentTab] = useState<'code' | 'fragment' | 'terminal' | 'interpreter' | 'editor'>('code')
  const [selectedFile, setSelectedFile] = useState<{ path: string; content: string } | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [isAuthDialogOpen, setAuthDialog] = useState(false)
  const [authView, setAuthView] = useState<ViewType>('sign_in')
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [executionResult, setExecutionResult] = useState<ExecutionResult | undefined>(undefined)
  
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [isLoadingProject, setIsLoadingProject] = useState(false)

  const { session, userTeam } = useAuth(setAuthDialog, setAuthView)


  const { executeCode: enhancedExecuteCode } = useEnhancedChat({
    userID: session?.user?.id,
    teamID: userTeam?.id,
    model: modelsList.models.find(m => m.id === languageModel.model)!,
    config: languageModel,
    template: templatesData,
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

  useEffect(() => {
    if (lastMessage) {
    }
  }, [lastMessage])

  const { object, submit, isLoading, stop, error } = useObject({
    api: `${API_BASE_URL}/api/chat`,
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
        posthog.capture('fragment_generated', {
          template: fragment?.template,
        })

        const response = await fetch(`${API_BASE_URL}/api/sandbox`, {
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

    submit({
      userID: session?.user?.id,
      teamID: userTeam?.id,
      messages: toAISDKMessages(updatedMessages),
      template: templates,
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
    const result = await enhancedExecuteCode(code)
    setExecutionResult(result)
  }

  return (
    <main className="flex min-h-screen max-h-screen">
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
        "grid w-full md:grid-cols-2 transition-all duration-300",
        session ? "ml-16" : ""
      )}>
        <div
          className={`flex flex-col w-full max-h-full max-w-[800px] mx-auto px-4 overflow-auto ${fragment ? 'col-span-1' : 'col-span-2'}`}
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
          
          <div className="flex justify-center mb-4">
            <HeroPillSecond />
          </div>

          {isLoadingProject ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">Loading project...</div>
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
