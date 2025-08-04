'use client'

import { useState } from 'react'
import { Download, X, Smartphone, Monitor } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { usePWA } from './pwa-provider'
import { cn } from '@/lib/utils'

interface InstallPromptProps {
  className?: string
  variant?: 'banner' | 'card' | 'button'
  onDismiss?: () => void
}

export function InstallPrompt({ className, variant = 'banner', onDismiss }: InstallPromptProps) {
  const { isInstallable, isInstalled, installApp } = usePWA()
  const [isDismissed, setIsDismissed] = useState(false)

  if (!isInstallable || isInstalled || isDismissed) {
    return null
  }

  const handleInstall = async () => {
    await installApp()
    setIsDismissed(true)
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
  }

  if (variant === 'button') {
    return (
      <Button
        onClick={handleInstall}
        variant="outline"
        size="sm"
        className={cn('flex items-center space-x-2', className)}
      >
        <Download className="h-4 w-4" />
        <span>Install App</span>
      </Button>
    )
  }

  if (variant === 'card') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={className}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Install Kanban Board</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Get the full app experience with offline access and faster loading
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Monitor className="h-4 w-4" />
                    <span>Works offline</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Download className="h-4 w-4" />
                    <span>Fast loading</span>
                  </div>
                </div>
                <Button onClick={handleInstall} size="sm">
                  Install
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    )
  }

  // Banner variant (default)
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground p-3',
          'border-b shadow-sm',
          className
        )}
      >
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Download className="h-5 w-5" />
            <div>
              <p className="font-medium">Install Kanban Board</p>
              <p className="text-sm opacity-90">
                Get the app for a better experience with offline access
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleInstall}
              variant="secondary"
              size="sm"
            >
              Install
            </Button>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

interface OfflineIndicatorProps {
  className?: string
  showText?: boolean
}

export function OfflineIndicator({ className, showText = true }: OfflineIndicatorProps) {
  const { isOnline } = usePWA()

  if (isOnline) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'fixed top-0 left-0 right-0 z-40 bg-yellow-500 text-yellow-900 p-2',
        'text-center text-sm font-medium',
        className
      )}
    >
      <div className="container mx-auto flex items-center justify-center space-x-2">
        <div className="h-2 w-2 bg-yellow-900 rounded-full animate-pulse" />
        {showText && <span>You're offline. Some features may be limited.</span>}
      </div>
    </motion.div>
  )
}

interface UpdatePromptProps {
  className?: string
  onDismiss?: () => void
}

export function UpdatePrompt({ className, onDismiss }: UpdatePromptProps) {
  const { hasUpdate, updateApp } = usePWA()
  const [isDismissed, setIsDismissed] = useState(false)

  if (!hasUpdate || isDismissed) {
    return null
  }

  const handleUpdate = async () => {
    await updateApp()
    setIsDismissed(true)
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className={cn(
          'fixed bottom-4 right-4 bg-card border rounded-lg shadow-lg p-4 max-w-sm',
          className
        )}
      >
        <div className="flex items-start justify-between space-x-3">
          <div>
            <h4 className="font-medium">Update Available</h4>
            <p className="text-sm text-muted-foreground mt-1">
              A new version of the app is ready to install
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2 mt-3">
          <Button onClick={handleUpdate} size="sm" className="flex-1">
            Update Now
          </Button>
          <Button onClick={handleDismiss} variant="outline" size="sm">
            Later
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
