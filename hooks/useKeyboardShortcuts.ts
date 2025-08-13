import { useEffect, useCallback, useRef } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  preventDefault?: boolean
  action: () => void
  description?: string
  enabled?: boolean
}

export interface UseKeyboardShortcutsOptions {
  target?: EventTarget | null
  capture?: boolean
}

function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { target = typeof window !== 'undefined' ? window : null, capture = false } = options
  const shortcutsRef = useRef(shortcuts)
  
  // Update shortcuts ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts
  }, [shortcuts])

  const handleKeyDown = useCallback((event: Event) => {
    const keyboardEvent = event as KeyboardEvent
    const activeShortcuts = shortcutsRef.current.filter(shortcut => shortcut.enabled !== false)
    
    for (const shortcut of activeShortcuts) {
      const {
        key,
        ctrlKey = false,
        shiftKey = false,
        altKey = false,
        metaKey = false,
        preventDefault = true,
        action
      } = shortcut

      const isKeyMatch = keyboardEvent.key.toLowerCase() === key.toLowerCase()
      const isCtrlMatch = keyboardEvent.ctrlKey === ctrlKey
      const isShiftMatch = keyboardEvent.shiftKey === shiftKey
      const isAltMatch = keyboardEvent.altKey === altKey
      const isMetaMatch = keyboardEvent.metaKey === metaKey

      if (isKeyMatch && isCtrlMatch && isShiftMatch && isAltMatch && isMetaMatch) {
        if (preventDefault) {
          keyboardEvent.preventDefault()
          keyboardEvent.stopPropagation()
        }
        
        action()
        break // Execute only the first matching shortcut
      }
    }
  }, [])

  useEffect(() => {
    if (!target) return

    target.addEventListener('keydown', handleKeyDown, capture)

    return () => {
      target.removeEventListener('keydown', handleKeyDown, capture)
    }
  }, [target, handleKeyDown, capture])

  return {
    shortcuts: shortcutsRef.current
  }
}

// Predefined common shortcuts
export const commonShortcuts = {
  save: (action: () => void): KeyboardShortcut => ({
    key: 's',
    ctrlKey: true,
    action,
    description: 'Save file',
  }),
  
  newFile: (action: () => void): KeyboardShortcut => ({
    key: 'n',
    ctrlKey: true,
    action,
    description: 'New file',
  }),
  
  openFile: (action: () => void): KeyboardShortcut => ({
    key: 'o',
    ctrlKey: true,
    action,
    description: 'Open file',
  }),
  
  find: (action: () => void): KeyboardShortcut => ({
    key: 'f',
    ctrlKey: true,
    action,
    description: 'Find',
  }),
  
  replace: (action: () => void): KeyboardShortcut => ({
    key: 'h',
    ctrlKey: true,
    action,
    description: 'Find and replace',
  }),
  
  toggleTerminal: (action: () => void): KeyboardShortcut => ({
    key: '`',
    ctrlKey: true,
    action,
    description: 'Toggle terminal',
  }),
  
  formatCode: (action: () => void): KeyboardShortcut => ({
    key: 'f',
    ctrlKey: true,
    shiftKey: true,
    action,
    description: 'Format code',
  }),
  
  runCode: (action: () => void): KeyboardShortcut => ({
    key: 'Enter',
    ctrlKey: true,
    action,
    description: 'Run code',
  }),
  
  comment: (action: () => void): KeyboardShortcut => ({
    key: '/',
    ctrlKey: true,
    action,
    description: 'Toggle comment',
  }),
  
  duplicate: (action: () => void): KeyboardShortcut => ({
    key: 'd',
    ctrlKey: true,
    action,
    description: 'Duplicate line',
  }),
  
  escape: (action: () => void): KeyboardShortcut => ({
    key: 'Escape',
    action,
    description: 'Close dialog/modal',
  }),
}

export default useKeyboardShortcuts