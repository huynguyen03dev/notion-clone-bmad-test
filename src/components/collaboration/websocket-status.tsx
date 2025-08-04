'use client'

import { useState, useEffect, useCallback } from 'react'
import { Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting'

interface WebSocketStatusIndicatorProps {
  status: WebSocketStatus
  onReconnect?: () => void
  className?: string
  showText?: boolean
  compact?: boolean
}

export function WebSocketStatusIndicator({
  status,
  onReconnect,
  className,
  showText = true,
  compact = false
}: WebSocketStatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-500',
          text: 'Connected',
          description: 'Real-time updates active'
        }
      case 'connecting':
        return {
          icon: Wifi,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500',
          text: 'Connecting...',
          description: 'Establishing connection'
        }
      case 'reconnecting':
        return {
          icon: Wifi,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500',
          text: 'Reconnecting...',
          description: 'Attempting to reconnect'
        }
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-500',
          text: 'Connection Error',
          description: 'Unable to connect to server'
        }
      case 'disconnected':
      default:
        return {
          icon: WifiOff,
          color: 'text-gray-500',
          bgColor: 'bg-gray-500',
          text: 'Disconnected',
          description: 'Real-time updates unavailable'
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  if (compact) {
    return (
      <div className={cn('flex items-center space-x-1', className)}>
        <motion.div
          animate={{
            scale: status === 'connecting' || status === 'reconnecting' ? [1, 1.2, 1] : 1
          }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className={cn('h-2 w-2 rounded-full', config.bgColor)}
        />
        {showText && (
          <span className="text-xs text-muted-foreground">
            {config.text}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <motion.div
        animate={{
          rotate: status === 'connecting' || status === 'reconnecting' ? 360 : 0
        }}
        transition={{
          rotate: { repeat: Infinity, duration: 2, ease: 'linear' }
        }}
      >
        <Icon className={cn('h-4 w-4', config.color)} />
      </motion.div>
      
      {showText && (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{config.text}</span>
          <span className="text-xs text-muted-foreground">
            {config.description}
          </span>
        </div>
      )}

      {(status === 'error' || status === 'disconnected') && onReconnect && (
        <Button
          variant="outline"
          size="sm"
          onClick={onReconnect}
          className="h-6 px-2 text-xs"
        >
          Retry
        </Button>
      )}
    </div>
  )
}

interface ConnectionQualityProps {
  latency?: number
  className?: string
}

export function ConnectionQuality({ latency, className }: ConnectionQualityProps) {
  const getQualityConfig = () => {
    if (!latency) {
      return {
        quality: 'unknown',
        color: 'bg-gray-400',
        text: 'Unknown'
      }
    }

    if (latency < 100) {
      return {
        quality: 'excellent',
        color: 'bg-green-500',
        text: 'Excellent'
      }
    }

    if (latency < 300) {
      return {
        quality: 'good',
        color: 'bg-yellow-500',
        text: 'Good'
      }
    }

    return {
      quality: 'poor',
      color: 'bg-red-500',
      text: 'Poor'
    }
  }

  const config = getQualityConfig()

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <div className="flex space-x-1">
        {[1, 2, 3].map((bar) => (
          <motion.div
            key={bar}
            className={cn(
              'w-1 rounded-full',
              bar === 1 && 'h-2',
              bar === 2 && 'h-3',
              bar === 3 && 'h-4',
              config.quality === 'excellent' && config.color,
              config.quality === 'good' && bar <= 2 && config.color,
              config.quality === 'poor' && bar === 1 && config.color,
              config.quality === 'unknown' && 'bg-gray-300'
            )}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: 1 }}
            transition={{ delay: bar * 0.1 }}
          />
        ))}
      </div>
      
      <span className="text-xs text-muted-foreground">
        {latency ? `${latency}ms` : config.text}
      </span>
    </div>
  )
}

// Hook for managing WebSocket connection status
export function useWebSocketStatus() {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected')
  const [latency, setLatency] = useState<number>()
  const [lastConnected, setLastConnected] = useState<Date>()

  const connect = useCallback(() => {
    setStatus('connecting')
    // This would be replaced with actual WebSocket connection logic
    setTimeout(() => {
      setStatus('connected')
      setLastConnected(new Date())
      setLatency(Math.floor(Math.random() * 200) + 50) // Mock latency
    }, 1000)
  }, [])

  const disconnect = useCallback(() => {
    setStatus('disconnected')
    setLatency(undefined)
  }, [])

  const reconnect = useCallback(() => {
    setStatus('reconnecting')
    setTimeout(() => {
      setStatus('connected')
      setLastConnected(new Date())
      setLatency(Math.floor(Math.random() * 200) + 50)
    }, 2000)
  }, [])

  useEffect(() => {
    // Auto-connect on mount
    connect()

    // Cleanup on unmount
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    status,
    latency,
    lastConnected,
    connect,
    disconnect,
    reconnect
  }
}
