'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { UserPresence } from './user-presence'
import { WebSocketStatus } from './websocket-status'

interface CollaborationContextType {
  // Connection status
  isConnected: boolean
  connectionStatus: WebSocketStatus
  latency?: number
  
  // User presence
  currentUsers: UserPresence[]
  currentBoard?: string
  
  // Actions
  joinBoard: (boardId: string) => void
  leaveBoard: () => void
  updateUserStatus: (status: 'active' | 'idle' | 'away') => void
  reconnect: () => void
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined)

interface CollaborationProviderProps {
  children: ReactNode
}

export function CollaborationProvider({ children }: CollaborationProviderProps) {
  const { data: session } = useSession()
  const [connectionStatus, setConnectionStatus] = useState<WebSocketStatus>('disconnected')
  const [currentUsers, setCurrentUsers] = useState<UserPresence[]>([])
  const [currentBoard, setCurrentBoard] = useState<string>()
  const [latency, setLatency] = useState<number>()

  // Mock WebSocket connection - in real implementation this would be actual WebSocket
  const [mockSocket, setMockSocket] = useState<{
    connected: boolean
    boardId?: string
  }>({ connected: false })

  // Mock users data - in real implementation this would come from WebSocket
  const mockUsers: UserPresence[] = [
    {
      id: '1',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
      isOnline: true,
      status: 'active',
      currentBoard: 'board-1',
      currentBoardName: 'Project Alpha'
    },
    {
      id: '2',
      name: 'Bob Smith',
      email: 'bob@example.com',
      initials: 'BS',
      isOnline: true,
      status: 'idle',
      currentBoard: 'board-1',
      currentBoardName: 'Project Alpha'
    },
    {
      id: '3',
      name: 'Carol Davis',
      email: 'carol@example.com',
      initials: 'CD',
      isOnline: false,
      lastSeen: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      currentBoard: 'board-2',
      currentBoardName: 'Marketing Campaign'
    }
  ]

  const connect = useCallback(() => {
    if (!session) return

    setConnectionStatus('connecting')
    
    // Simulate connection delay
    setTimeout(() => {
      setMockSocket({ connected: true })
      setConnectionStatus('connected')
      setLatency(Math.floor(Math.random() * 100) + 50)
      
      // Load initial users for current board
      if (currentBoard) {
        const boardUsers = mockUsers.filter(user => user.currentBoard === currentBoard)
        setCurrentUsers(boardUsers)
      }
    }, 1000)
  }, [session, currentBoard])

  const disconnect = useCallback(() => {
    setMockSocket({ connected: false })
    setConnectionStatus('disconnected')
    setCurrentUsers([])
    setLatency(undefined)
  }, [])

  const reconnect = useCallback(() => {
    setConnectionStatus('reconnecting')
    setTimeout(() => {
      connect()
    }, 2000)
  }, [connect])

  const joinBoard = useCallback((boardId: string) => {
    setCurrentBoard(boardId)
    
    if (mockSocket.connected) {
      // Filter users for the specific board
      const boardUsers = mockUsers.filter(user => user.currentBoard === boardId)
      setCurrentUsers(boardUsers)
      
      // Add current user to the list if authenticated
      if (session?.user) {
        const currentUser: UserPresence = {
          id: session.user.id || 'current',
          name: session.user.name || 'You',
          email: session.user.email || '',
          avatar: session.user.image || undefined,
          isOnline: true,
          status: 'active',
          currentBoard: boardId,
          currentBoardName: `Board ${boardId}`
        }
        
        setCurrentUsers(prev => {
          const filtered = prev.filter(u => u.id !== currentUser.id)
          return [currentUser, ...filtered]
        })
      }
    }
  }, [mockSocket.connected, session])

  const leaveBoard = useCallback(() => {
    setCurrentBoard(undefined)
    setCurrentUsers([])
  }, [])

  const updateUserStatus = useCallback((status: 'active' | 'idle' | 'away') => {
    if (!session?.user) return
    
    setCurrentUsers(prev => 
      prev.map(user => 
        user.id === (session.user.id || 'current')
          ? { ...user, status }
          : user
      )
    )
  }, [session])

  // Auto-connect when session is available
  useEffect(() => {
    if (session) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [session, connect, disconnect])

  // Simulate user activity detection
  useEffect(() => {
    let idleTimer: NodeJS.Timeout
    let awayTimer: NodeJS.Timeout

    const resetTimers = () => {
      clearTimeout(idleTimer)
      clearTimeout(awayTimer)
      
      updateUserStatus('active')
      
      // Set idle after 5 minutes of inactivity
      idleTimer = setTimeout(() => {
        updateUserStatus('idle')
        
        // Set away after 15 minutes of inactivity
        awayTimer = setTimeout(() => {
          updateUserStatus('away')
        }, 10 * 60 * 1000) // 10 more minutes
      }, 5 * 60 * 1000) // 5 minutes
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    
    events.forEach(event => {
      document.addEventListener(event, resetTimers, true)
    })

    resetTimers()

    return () => {
      clearTimeout(idleTimer)
      clearTimeout(awayTimer)
      events.forEach(event => {
        document.removeEventListener(event, resetTimers, true)
      })
    }
  }, [updateUserStatus])

  const value: CollaborationContextType = {
    isConnected: mockSocket.connected,
    connectionStatus,
    latency,
    currentUsers,
    currentBoard,
    joinBoard,
    leaveBoard,
    updateUserStatus,
    reconnect
  }

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  )
}

export function useCollaboration() {
  const context = useContext(CollaborationContext)
  if (context === undefined) {
    throw new Error('useCollaboration must be used within a CollaborationProvider')
  }
  return context
}
