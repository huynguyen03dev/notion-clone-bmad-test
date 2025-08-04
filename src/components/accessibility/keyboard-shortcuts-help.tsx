'use client'

import { useState } from 'react'
import { X, Keyboard } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useKeyboardShortcuts, type KeyboardShortcut } from './keyboard-shortcuts'
import { cn } from '@/lib/utils'

interface KeyboardShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
}

export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  const { shortcuts } = useKeyboardShortcuts()

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = []
    }
    acc[shortcut.category].push(shortcut)
    return acc
  }, {} as Record<string, KeyboardShortcut[]>)

  const categoryLabels = {
    navigation: 'Navigation',
    actions: 'Actions',
    general: 'General'
  }

  const categoryDescriptions = {
    navigation: 'Navigate between different sections of the application',
    actions: 'Perform common actions quickly',
    general: 'General application shortcuts'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Keyboard className="h-5 w-5" />
            <span>Keyboard Shortcuts</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Use these keyboard shortcuts to navigate and interact with the application more efficiently.
          </p>

          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              <div>
                <h3 className="font-semibold text-lg">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {categoryDescriptions[category as keyof typeof categoryDescriptions]}
                </p>
              </div>

              <div className="grid gap-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <motion.div
                    key={shortcut.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <KeyboardKey shortcut={shortcut.key} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                <p>Press <kbd className="px-2 py-1 text-xs bg-muted rounded">?</kbd> anytime to show this help</p>
                <p className="mt-1">Press <kbd className="px-2 py-1 text-xs bg-muted rounded">Escape</kbd> to close dialogs</p>
              </div>
              <Button onClick={onClose} variant="outline" size="sm">
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface KeyboardKeyProps {
  shortcut: string
}

function KeyboardKey({ shortcut }: KeyboardKeyProps) {
  const keys = shortcut.split(' ')
  
  return (
    <div className="flex items-center space-x-1">
      {keys.map((key, index) => (
        <div key={index} className="flex items-center space-x-1">
          {index > 0 && (
            <span className="text-xs text-muted-foreground">then</span>
          )}
          <kbd className={cn(
            'px-2 py-1 text-xs font-mono bg-muted rounded border',
            'min-w-[24px] text-center'
          )}>
            {key === 'Escape' ? 'Esc' : key}
          </kbd>
        </div>
      ))}
    </div>
  )
}

// Hook to easily integrate keyboard shortcuts help into any component
export function useKeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false)

  const showHelp = () => setIsOpen(true)
  const hideHelp = () => setIsOpen(false)

  return {
    isOpen,
    showHelp,
    hideHelp,
    KeyboardShortcutsHelpModal: () => (
      <KeyboardShortcutsHelp isOpen={isOpen} onClose={hideHelp} />
    )
  }
}
