'use client'

import { ViewType } from '@/components/auth';
import { AuthDialog } from '@/components/auth-dialog';
import { Chat } from '@/components/chat';
import { PromptInputBox } from '@/components/ui/ai-prompt-box';
import { NavBar } from '@/components/navbar';
import { Sidebar } from '@/components/sidebar';
import { useAuth } from '@/lib/auth';
import { Project, saveMessage, getProjectMessages, getProject } from '@/lib/database';
import { Message, toMessageImage } from '@/lib/messages';
import { LLMModelConfig } from '@/lib/models';
import modelsList from '@/lib/models.json';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import templates, { TemplateId } from '@/lib/templates';
import { cn } from '@/lib/utils';
import { usePostHog } from 'posthog-js/react';
import { useCallback, useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { useUserTeam } from '@/lib/user-team-provider';
import { HeroPillSecond } from '@/components/announcement';
import { useAnalytics } from '@/lib/analytics-service';
import { SupabaseClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

export default function Home() {
  const supabase = createSupabaseBrowserClient()
  const [selectedTemplate, setSelectedTemplate] = useState<'auto' | TemplateId>('auto')
  const [languageModel, setLanguageModel] = useLocalStorage<LLMModelConfig>(
    'languageModel',
    {
      model: 'claude-3-5-sonnet-latest',
    },
  )

  const posthog = usePostHog()
  const analytics = useAnalytics()

  const [sessionStartTime] = useState(Date.now())
  const [fragmentsGenerated, setFragmentsGenerated] = useState(0)
  const [messagesCount, setMessagesCount] = useState(0)
  const [errorsEncountered, setErrorsEncountered] = useState(0)
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAuthDialogOpen, setAuthDialog] = useState(false);
  const [authView, setAuthView] = useState<ViewType>('sign_in')
  const setAuthDialogCallback = useCallback((isOpen: boolean) => {
    setAuthDialog(isOpen)
  }, [setAuthDialog])

  const setAuthViewCallback = useCallback((view: ViewType) => {
    setAuthView(view)
  }, [setAuthView])
  
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [isLoadingProject, setIsLoadingProject] = useState(false)

  const { session } = useAuth(setAuthDialogCallback, setAuthViewCallback)
  const { userTeam } = useUserTeam()
  const router = useRouter();


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

  async function handleSendPrompt(message: string, files: File[] = []) {
    if (!session) {
      return setAuthDialog(true)
    }

    const currentInput = message
    const currentFiles = files
    
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

    // Store prompt and chat settings in local storage
    localStorage.setItem('userPrompt', currentInput);
    localStorage.setItem('chatSettings', JSON.stringify(languageModel));
    localStorage.setItem('selectedTemplate', selectedTemplate);

    // Redirect to the generation page
    router.push('/generation');

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
    }

    // Enhanced social tracking
    analytics.trackFeatureUsed(`social_${target}`, { target })
    
    posthog.capture(`${target}_click`)
  }

  function handleClearChat() {
    setMessages([])
    setCurrentProject(null)
  }

  return (
    <main className="flex min-h-screen max-h-screen">
      {supabase && (
        <AuthDialog
          open={isAuthDialogOpen}
          setOpen={setAuthDialog}
          view={authView}
          supabase={supabase as unknown as SupabaseClient<any, "public", "public">}
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
          className={`flex flex-col w-full h-screen max-w-[800px] mx-auto px-4 col-span-2`}
        >
          <NavBar
            session={session}
            showLogin={() => setAuthDialog(true)}
            signOut={logout}
            onSocialClick={handleSocialClick}
            onClear={handleClearChat}
            canClear={messages.length > 0}
            canUndo={false}
            onUndo={() => {}}
          />
          
          <div className="flex justify-center mb-4">
            <HeroPillSecond />
          </div>

          <div className="flex-grow overflow-y-auto">
            {isLoadingProject ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-muted-foreground">Loading project...</div>
              </div>
            ) : (
              <Chat
                messages={messages}
                isLoading={false}
                setCurrentPreview={() => {}}
              />
            )}
          </div>
          
          <div className="space-y-4 mt-4">
              <PromptInputBox
                onSend={handleSendPrompt}
                templates={templates}
                selectedTemplate={selectedTemplate}
                onSelectedTemplateChange={setSelectedTemplate}
                models={filteredModels}
                languageModel={languageModel}
                onLanguageModelChange={handleLanguageModelChange}
                apiKeyConfigurable={!process.env.NEXT_PUBLIC_NO_API_KEY_INPUT}
                baseURLConfigurable={!process.env.NEXT_PUBLIC_NO_BASE_URL_INPUT}
              />
          </div>
        </div>
      </div>
    </main>
  )
}
