'use client'

import { Button } from './ui/button'
import { Input } from './ui/input'
import { ScrollArea } from './ui/scroll-area'
import { ExecutionResult } from '@/lib/types'
import { Terminal, X, Copy, RefreshCw } from 'lucide-react'
import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { CopyButton } from './ui/copy-button'
import { API_BASE_URL } from '@/lib/config'

interface TerminalEntry {
  id: string
  command: string
  output: string
  error?: string
  timestamp: Date
  isRunning?: boolean
}

interface FragmentTerminalProps {
  result: ExecutionResult
  teamID?: string
  accessToken?: string
}

export function FragmentTerminal({ result, teamID, accessToken }: FragmentTerminalProps) {
  const [entries, setEntries] = useState<TerminalEntry[]>([])
  const [currentCommand, setCurrentCommand] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [workingDirectory, setWorkingDirectory] = useState('/home/user')
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Auto-scroll to bottom when new entries are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [entries])

  useEffect(() => {
    // Focus input when component mounts
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const executeCommand = async (command: string) => {
    if (!command.trim() || isExecuting) return

    const entryId = Date.now().toString()
    const newEntry: TerminalEntry = {
      id: entryId,
      command: command.trim(),
      output: '',
      timestamp: new Date(),
      isRunning: true
    }

    setEntries(prev => [...prev, newEntry])
    setCurrentCommand('')
    setIsExecuting(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/terminal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: command.trim(),
          sbxId: result.sbxId,
          workingDirectory,
          teamID,
          accessToken,
        }),
      })

      const data = await response.json()

      setEntries(prev => prev.map(entry => 
        entry.id === entryId 
          ? {
              ...entry,
              output: data.stdout || '',
              error: data.stderr || data.error,
              isRunning: false
            }
          : entry
      ))

      // Update working directory if command was cd
      if (command.trim().startsWith('cd') && !data.error && !data.stderr) {
        const pwdResponse = await fetch(`${API_BASE_URL}/api/terminal`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            command: 'pwd',
            sbxId: result.sbxId,
            workingDirectory,
            teamID,
            accessToken,
          }),
        })
        const pwdData = await pwdResponse.json()
        if (pwdData.stdout) {
          setWorkingDirectory(pwdData.stdout.trim())
        }
      }

    } catch (error) {
      setEntries(prev => prev.map(entry => 
        entry.id === entryId 
          ? {
              ...entry,
              output: '',
              error: `Failed to execute command: ${error}`,
              isRunning: false
            }
          : entry
      ))
    }

    setIsExecuting(false)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      executeCommand(currentCommand)
    }
  }

  const clearTerminal = () => {
    setEntries([])
  }

  const copyAllOutput = () => {
    const allOutput = entries.map(entry => {
      const prompt = `${workingDirectory}$ ${entry.command}`
      const output = entry.error || entry.output
      return output ? `${prompt}\n${output}` : prompt
    }).join('\n\n')
    
    navigator.clipboard.writeText(allOutput)
  }

  if (!result || result.template === 'code-interpreter-v1') {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center space-y-2">
          <Terminal className="h-8 w-8 mx-auto opacity-50" />
          <p className="text-sm">Terminal not available for this fragment type</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background font-mono text-sm">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4" />
          <span className="text-xs text-muted-foreground">
            Terminal - {result.sbxId?.slice(0, 8)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={copyAllOutput}
            disabled={entries.length === 0}
            className="h-7 w-7 p-0"
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearTerminal}
            disabled={entries.length === 0}
            className="h-7 w-7 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 flex flex-col min-h-0">
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
          <div className="space-y-2">
            {entries.length === 0 && (
              <div className="text-muted-foreground text-xs">
                Welcome to the terminal. Type commands to interact with your sandbox.
              </div>
            )}
            
            {entries.map((entry) => (
              <div key={entry.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-green-500 dark:text-green-400">
                    {workingDirectory}$
                  </span>
                  <span className="text-foreground">{entry.command}</span>
                  {entry.isRunning && (
                    <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
                  )}
                </div>
                
                {(entry.output || entry.error) && (
                  <div className="pl-4 border-l-2 border-muted">
                    {entry.error ? (
                      <div className="text-red-500 dark:text-red-400 whitespace-pre-wrap">
                        {entry.error}
                      </div>
                    ) : (
                      <div className="text-muted-foreground whitespace-pre-wrap">
                        {entry.output}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Command Input */}
        <div className="border-t bg-background p-4">
          <div className="flex items-center gap-2">
            <span className="text-green-500 dark:text-green-400 shrink-0">
              {workingDirectory}$
            </span>
            <Input
              ref={inputRef}
              value={currentCommand}
              onChange={(e) => setCurrentCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter command..."
              disabled={isExecuting}
              className="border-none bg-transparent font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            {isExecuting && (
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}