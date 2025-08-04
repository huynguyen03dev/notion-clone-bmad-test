'use client'

import { useEffect, useState } from 'react'
import { WifiOff, RefreshCw, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)

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

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      window.location.href = '/'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center">
            <motion.div
              animate={{ 
                rotate: isOnline ? 0 : [0, -10, 10, -10, 0],
                scale: isOnline ? 1 : [1, 1.1, 1]
              }}
              transition={{ 
                rotate: { repeat: Infinity, duration: 2 },
                scale: { repeat: Infinity, duration: 1.5 }
              }}
              className="mx-auto mb-4"
            >
              <WifiOff className={`h-16 w-16 ${isOnline ? 'text-green-500' : 'text-muted-foreground'}`} />
            </motion.div>
            
            <CardTitle className="text-2xl">
              {isOnline ? 'Back Online!' : 'You\'re Offline'}
            </CardTitle>
            
            <CardDescription className="text-base">
              {isOnline 
                ? 'Your connection has been restored. You can now access all features.'
                : 'It looks like you\'re not connected to the internet. Some features may be limited.'
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {isOnline ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                <Button onClick={handleRefresh} className="w-full" size="lg">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Page
                </Button>
                
                <Button variant="outline" asChild className="w-full">
                  <Link href="/">
                    <Home className="h-4 w-4 mr-2" />
                    Go to Dashboard
                  </Link>
                </Button>
              </motion.div>
            ) : (
              <div className="space-y-3">
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-medium mb-2">Available Offline:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• View cached boards and tasks</li>
                    <li>• Create and edit tasks (syncs when online)</li>
                    <li>• Browse your profile</li>
                    <li>• Access help and documentation</li>
                  </ul>
                </div>

                <Button onClick={handleRefresh} variant="outline" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                
                <Button onClick={handleGoBack} variant="ghost" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                <span>
                  {isOnline ? 'Connected' : 'Offline Mode'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips for offline usage */}
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Offline Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <h5 className="font-medium">Working Offline</h5>
                  <p className="text-muted-foreground">
                    Your changes are saved locally and will sync automatically when you're back online.
                  </p>
                </div>
                
                <div>
                  <h5 className="font-medium">Cached Content</h5>
                  <p className="text-muted-foreground">
                    Recently viewed boards and tasks are available offline for viewing and editing.
                  </p>
                </div>
                
                <div>
                  <h5 className="font-medium">Sync Status</h5>
                  <p className="text-muted-foreground">
                    Look for the sync indicator in the navigation to see when your changes are being uploaded.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
