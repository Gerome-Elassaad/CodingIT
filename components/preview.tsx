import { DeployDialog } from './deploy-dialog'
import { EnhancedCodeInterpreter } from './enhanced-code-interpreter'
import { FragmentCode } from './fragment-code'
import { FragmentPreview } from './fragment-preview'
import { FragmentTerminal } from './fragment-terminal'
import { ErrorBoundary } from './error-boundary'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { FragmentSchema } from '@/lib/schema'
import { ExecutionResult } from '@/lib/types'
import { DeepPartial } from 'ai'
import { ChevronsRight, LoaderCircle, Terminal, CodeIcon } from 'lucide-react'
import { Dispatch, SetStateAction } from 'react'

export function Preview({
  teamID,
  accessToken,
  selectedTab,
  onSelectedTabChange,
  isChatLoading,
  isPreviewLoading,
  fragment,
  result,
  onClose,
  code,
  executeCode,
}: {
  teamID: string | undefined
  accessToken: string | undefined
  selectedTab: 'code' | 'fragment' | 'terminal' | 'interpreter'
  onSelectedTabChange: Dispatch<SetStateAction<'code' | 'fragment' | 'terminal' | 'interpreter'>>
  isChatLoading: boolean
  isPreviewLoading: boolean
  fragment?: DeepPartial<FragmentSchema>
  result?: ExecutionResult
  onClose: () => void
  code: string
  executeCode: (code: string) => Promise<void>
}) {
  if (!fragment) {
    return null
  }

  const isLinkAvailable = result?.template !== 'code-interpreter-v1'
  const isTerminalAvailable = result && result.template !== 'code-interpreter-v1'

  return (
    <div className="absolute md:relative z-10 top-0 left-0 shadow-2xl md:rounded-tl-3xl md:rounded-bl-3xl md:border-l md:border-y bg-popover h-full w-full overflow-auto">
      <Tabs
        value={selectedTab}
        onValueChange={(value) =>
          onSelectedTabChange(value as 'code' | 'fragment' | 'terminal' | 'interpreter')
        }
        className="h-full flex flex-col items-start justify-start"
      >
        <div className="w-full p-2 grid grid-cols-3 items-center border-b">
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground"
                  onClick={onClose}
                >
                  <ChevronsRight className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Close sidebar</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="flex justify-center">
            <TabsList className="px-1 py-0 border h-8">
              <TabsTrigger
                className="font-normal text-xs py-1 px-2 gap-1 flex items-center"
                value="code"
              >
                {isChatLoading && (
                  <LoaderCircle
                    strokeWidth={3}
                    className="h-3 w-3 animate-spin"
                  />
                )}
                Code
              </TabsTrigger>
              <TabsTrigger
                disabled={!result}
                className="font-normal text-xs py-1 px-2 gap-1 flex items-center"
                value="fragment"
              >
                Preview
                {isPreviewLoading && (
                  <LoaderCircle
                    strokeWidth={3}
                    className="h-3 w-3 animate-spin"
                  />
                )}
              </TabsTrigger>
              <TabsTrigger
                disabled={isPreviewLoading || !result || result.template !== 'code-interpreter-v1'}
                className="font-normal text-xs py-1 px-2 gap-1 flex items-center"
                value="interpreter"
              >
                <CodeIcon className="h-3 w-3" />
                Interpreter
              </TabsTrigger>
              <TabsTrigger
                disabled={!isTerminalAvailable}
                className="font-normal text-xs py-1 px-2 gap-1 flex items-center"
                value="terminal"
              >
                <Terminal className="h-3 w-3" />
                Terminal
              </TabsTrigger>
            </TabsList>
          </div>
          {result && (
            <div className="flex items-center justify-end gap-2">
              {isLinkAvailable && (
                <DeployDialog
                  url={result.url!}
                  sbxId={result.sbxId!}
                  teamID={teamID}
                  accessToken={accessToken}
                />
              )}
            </div>
          )}
        </div>
        {fragment && (
          <div className="overflow-y-auto w-full h-full">
            <TabsContent value="code" className="h-full">
              <ErrorBoundary>
                <FragmentCode />
              </ErrorBoundary>
            </TabsContent>
            <TabsContent value="fragment" className="h-full">
              {result && (
                <ErrorBoundary>
                  <FragmentPreview
                    result={result as ExecutionResult}
                    code={code}
                    executeCode={executeCode}
                  />
                </ErrorBoundary>
              )}
            </TabsContent>
            <TabsContent value="interpreter" className="h-full">
              <ErrorBoundary>
                <EnhancedCodeInterpreter
                  result={result && result.template === 'code-interpreter-v1' ? result : undefined}
                  code={code}
                  executeCode={executeCode}
                />
              </ErrorBoundary>
            </TabsContent>
            <TabsContent value="terminal" className="h-full">
              {result && (
                <ErrorBoundary>
                  <FragmentTerminal 
                    result={result as ExecutionResult}
                    teamID={teamID}
                    accessToken={accessToken}
                  />
                </ErrorBoundary>
              )}
            </TabsContent>
          </div>
        )}
      </Tabs>
    </div>
  )
}
