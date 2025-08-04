'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  initials?: string
}

export interface UserPresence extends User {
  isOnline: boolean
  lastSeen?: Date
  currentBoard?: string
  currentBoardName?: string
  status?: 'active' | 'idle' | 'away'
}

interface UserPresenceIndicatorProps {
  user: UserPresence
  size?: 'sm' | 'md' | 'lg'
  showStatus?: boolean
  showTooltip?: boolean
  className?: string
}

export function UserPresenceIndicator({
  user,
  size = 'md',
  showStatus = true,
  showTooltip = true,
  className
}: UserPresenceIndicatorProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  }

  const statusColors = {
    active: 'bg-green-500',
    idle: 'bg-yellow-500',
    away: 'bg-gray-500'
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getStatusText = () => {
    if (!user.isOnline) return 'Offline'
    if (user.status === 'active') return 'Active'
    if (user.status === 'idle') return 'Idle'
    if (user.status === 'away') return 'Away'
    return 'Online'
  }

  const getLastSeenText = () => {
    if (user.isOnline) return 'Online now'
    if (!user.lastSeen) return 'Last seen unknown'
    
    const now = new Date()
    const diff = now.getTime() - user.lastSeen.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div className={cn('relative inline-block', className)}>
      <Avatar className={cn(sizeClasses[size], 'ring-2 ring-background')}>
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback className="text-xs font-medium">
          {user.initials || getInitials(user.name)}
        </AvatarFallback>
      </Avatar>

      {/* Online Status Indicator */}
      {showStatus && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(
            'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background',
            user.isOnline 
              ? statusColors[user.status || 'active']
              : 'bg-gray-400'
          )}
        />
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-10">
          <div className="font-medium">{user.name}</div>
          <div className="text-muted-foreground">{getStatusText()}</div>
          <div className="text-muted-foreground">{getLastSeenText()}</div>
          {user.currentBoardName && (
            <div className="text-muted-foreground">
              Working on: {user.currentBoardName}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface UserPresenceListProps {
  users: UserPresence[]
  maxVisible?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function UserPresenceList({
  users,
  maxVisible = 5,
  size = 'md',
  className
}: UserPresenceListProps) {
  const visibleUsers = users.slice(0, maxVisible)
  const hiddenCount = Math.max(0, users.length - maxVisible)

  return (
    <div className={cn('flex items-center space-x-1', className)}>
      <AnimatePresence>
        {visibleUsers.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: index * 0.1 }}
            className="group"
            style={{ zIndex: visibleUsers.length - index }}
          >
            <UserPresenceIndicator
              user={user}
              size={size}
              className={index > 0 ? '-ml-2' : ''}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {hiddenCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            'flex items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-medium border-2 border-background',
            size === 'sm' && 'h-6 w-6',
            size === 'md' && 'h-8 w-8',
            size === 'lg' && 'h-10 w-10'
          )}
        >
          +{hiddenCount}
        </motion.div>
      )}
    </div>
  )
}

interface CollaborationStatusProps {
  isConnected: boolean
  userCount: number
  className?: string
}

export function CollaborationStatus({
  isConnected,
  userCount,
  className
}: CollaborationStatusProps) {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <div className="flex items-center space-x-1">
        <motion.div
          animate={{
            scale: isConnected ? [1, 1.2, 1] : 1,
            opacity: isConnected ? 1 : 0.5
          }}
          transition={{
            scale: { repeat: Infinity, duration: 2 },
            opacity: { duration: 0.3 }
          }}
          className={cn(
            'h-2 w-2 rounded-full',
            isConnected ? 'bg-green-500' : 'bg-red-500'
          )}
        />
        <span className="text-xs text-muted-foreground">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      
      {userCount > 0 && (
        <Badge variant="secondary" className="text-xs">
          {userCount} online
        </Badge>
      )}
    </div>
  )
}
