'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'

interface PWAContextType {
  // Installation
  isInstallable: boolean
  isInstalled: boolean
  installApp: () => Promise<void>
  
  // Offline status
  isOnline: boolean
  
  // Service Worker
  isServiceWorkerSupported: boolean
  isServiceWorkerRegistered: boolean
  serviceWorkerRegistration: ServiceWorkerRegistration | null
  
  // Updates
  hasUpdate: boolean
  updateApp: () => Promise<void>
  
  // Notifications
  notificationPermission: NotificationPermission
  requestNotificationPermission: () => Promise<NotificationPermission>
}

const PWAContext = createContext<PWAContextType | undefined>(undefined)

interface PWAProviderProps {
  children: ReactNode
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [isServiceWorkerSupported] = useState('serviceWorker' in navigator)
  const [isServiceWorkerRegistered, setIsServiceWorkerRegistered] = useState(false)
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [hasUpdate, setHasUpdate] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  // Check if app is already installed
  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isInWebAppiOS = (window.navigator as any).standalone === true
      setIsInstalled(isStandalone || isInWebAppiOS)
    }

    checkInstalled()
    window.addEventListener('resize', checkInstalled)
    return () => window.removeEventListener('resize', checkInstalled)
  }, [])

  // Handle install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    setIsOnline(navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Register service worker
  useEffect(() => {
    if (!isServiceWorkerSupported) return

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        setServiceWorkerRegistration(registration)
        setIsServiceWorkerRegistered(true)

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setHasUpdate(true)
              }
            })
          }
        })

        console.log('Service Worker registered successfully')
      } catch (error) {
        console.error('Service Worker registration failed:', error)
      }
    }

    registerServiceWorker()
  }, [isServiceWorkerSupported])

  // Check notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  const installApp = useCallback(async () => {
    if (!deferredPrompt) return

    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
      } else {
        console.log('User dismissed the install prompt')
      }
      
      setDeferredPrompt(null)
      setIsInstallable(false)
    } catch (error) {
      console.error('Error during app installation:', error)
    }
  }, [deferredPrompt])

  const updateApp = useCallback(async () => {
    if (!serviceWorkerRegistration) return

    try {
      const waitingWorker = serviceWorkerRegistration.waiting
      if (waitingWorker) {
        waitingWorker.postMessage({ type: 'SKIP_WAITING' })
        waitingWorker.addEventListener('statechange', () => {
          if (waitingWorker.state === 'activated') {
            window.location.reload()
          }
        })
      }
    } catch (error) {
      console.error('Error updating app:', error)
    }
  }, [serviceWorkerRegistration])

  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      return 'denied'
    }

    try {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      return permission
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return 'denied'
    }
  }, [])

  const value: PWAContextType = {
    isInstallable,
    isInstalled,
    installApp,
    isOnline,
    isServiceWorkerSupported,
    isServiceWorkerRegistered,
    serviceWorkerRegistration,
    hasUpdate,
    updateApp,
    notificationPermission,
    requestNotificationPermission
  }

  return (
    <PWAContext.Provider value={value}>
      {children}
    </PWAContext.Provider>
  )
}

export function usePWA() {
  const context = useContext(PWAContext)
  if (context === undefined) {
    throw new Error('usePWA must be used within a PWAProvider')
  }
  return context
}
