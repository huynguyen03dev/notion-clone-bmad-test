'use client'

import { useEffect, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export interface KeyboardShortcut {
  key: string
  description: string
  action: () => void
  category: 'navigation' | 'actions' | 'general'
  requiresAuth?: boolean
}

interface UseKeyboardShortcutsProps {
  onShowHelp?: () => void
  onGlobalSearch?: () => void
  onCreateBoard?: () => void
  onCreateTask?: () => void
}

export function useKeyboardShortcuts({
  onShowHelp,
  onGlobalSearch,
  onCreateBoard,
  onCreateTask
}: UseKeyboardShortcutsProps = {}) {
  const router = useRouter()
  const { data: session } = useSession()
  const [isEnabled, setIsEnabled] = useState(true)

  const shortcuts: KeyboardShortcut[] = [
    // Navigation shortcuts
    {
      key: 'g d',
      description: 'Go to Dashboard',
      action: () => router.push('/dashboard'),
      category: 'navigation',
      requiresAuth: true
    },
    {
      key: 'g b',
      description: 'Go to Boards',
      action: () => router.push('/boards'),
      category: 'navigation',
      requiresAuth: true
    },
    {
      key: 'g s',
      description: 'Go to Search',
      action: () => router.push('/search'),
      category: 'navigation',
      requiresAuth: true
    },
    {
      key: 'g p',
      description: 'Go to Profile',
      action: () => router.push('/profile'),
      category: 'navigation',
      requiresAuth: true
    },
    
    // Action shortcuts
    {
      key: 'c b',
      description: 'Create new board',
      action: () => onCreateBoard?.(),
      category: 'actions',
      requiresAuth: true
    },
    {
      key: 'c t',
      description: 'Create new task',
      action: () => onCreateTask?.(),
      category: 'actions',
      requiresAuth: true
    },
    {
      key: '/',
      description: 'Focus search',
      action: () => onGlobalSearch?.(),
      category: 'actions',
      requiresAuth: true
    },
    
    // General shortcuts
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      action: () => onShowHelp?.(),
      category: 'general'
    },
    {
      key: 'Escape',
      description: 'Close modal/dropdown',
      action: () => {
        // This will be handled by individual components
        const event = new KeyboardEvent('keydown', { key: 'Escape' })
        document.dispatchEvent(event)
      },
      category: 'general'
    }
  ]

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isEnabled) return

    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // Exception: allow '?' and 'Escape' even in inputs
      if (event.key !== '?' && event.key !== 'Escape') {
        return
      }
    }

    // Handle single key shortcuts
    const singleKeyShortcuts = shortcuts.filter(s => s.key.length === 1 || s.key === 'Escape')
    const matchingSingle = singleKeyShortcuts.find(shortcut => {
      if (shortcut.requiresAuth && !session) return false
      return shortcut.key === event.key
    })

    if (matchingSingle) {
      event.preventDefault()
      matchingSingle.action()
      return
    }

    // Handle multi-key shortcuts (like 'g d')
    if (event.key === 'g' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault()
      
      // Listen for the next key
      const handleSecondKey = (secondEvent: KeyboardEvent) => {
        const combo = `g ${secondEvent.key}`
        const matchingCombo = shortcuts.find(shortcut => {
          if (shortcut.requiresAuth && !session) return false
          return shortcut.key === combo
        })

        if (matchingCombo) {
          secondEvent.preventDefault()
          matchingCombo.action()
        }
        
        document.removeEventListener('keydown', handleSecondKey)
      }

      document.addEventListener('keydown', handleSecondKey)
      
      // Remove listener after 2 seconds if no second key is pressed
      setTimeout(() => {
        document.removeEventListener('keydown', handleSecondKey)
      }, 2000)
    }

    if (event.key === 'c' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault()
      
      const handleSecondKey = (secondEvent: KeyboardEvent) => {
        const combo = `c ${secondEvent.key}`
        const matchingCombo = shortcuts.find(shortcut => {
          if (shortcut.requiresAuth && !session) return false
          return shortcut.key === combo
        })

        if (matchingCombo) {
          secondEvent.preventDefault()
          matchingCombo.action()
        }
        
        document.removeEventListener('keydown', handleSecondKey)
      }

      document.addEventListener('keydown', handleSecondKey)
      
      setTimeout(() => {
        document.removeEventListener('keydown', handleSecondKey)
      }, 2000)
    }
  }, [isEnabled, session, shortcuts, onShowHelp, onGlobalSearch, onCreateBoard, onCreateTask, router])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return {
    shortcuts: shortcuts.filter(s => !s.requiresAuth || session),
    isEnabled,
    setIsEnabled
  }
}
