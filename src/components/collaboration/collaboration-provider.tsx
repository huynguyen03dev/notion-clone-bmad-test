'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { UserPresence } from './user-presence'
import { WebSocketStatus } from './websocket-status'

// Mock users data - hoisted to module scope to maintain stable reference
const MOCK_USERS: UserPresence[] = [
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
    lastSeen: new Date(Date.now() - 1000 * 60 * 30),
    currentBoard: 'board-2',
    currentBoardName: 'Marketing Campaign'
  }
]

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

  // 🔧 FIX: Use refs to store current values and prevent stale closures
  const currentBoardRef = useRef(currentBoard)
  const sessionRef = useRef(session)
  const mockSocketRef = useRef(mockSocket)

  // Update refs when state changes
  currentBoardRef.current = currentBoard
  sessionRef.current = session
  mockSocketRef.current = mockSocket

  // Mock users data - in real implementation this would come from WebSocket
  // Hoisted to module scope (see top of file) to maintain stable reference

  // 🔧 FIX: Make connect function stable by using refs instead of state dependencies
  const connect = useCallback(() => {
    const currentSession = sessionRef.current
    if (!currentSession) return

    setConnectionStatus('connecting')

    // Simulate connection delay
    setTimeout(() => {
      setMockSocket({ connected: true })
      setConnectionStatus('connected')
      setLatency(Math.floor(Math.random() * 100) + 50)

      // Load initial users for current board using ref to avoid dependency
      const board = currentBoardRef.current
      if (board) {
        const boardUsers = MOCK_USERS.filter(user => user.currentBoard === board)

        // Ensure the authenticated user is present immediately after connect
        const currentSessionAfterConnect = sessionRef.current
        const withCurrentUser = (() => {
          if (!currentSessionAfterConnect?.user) return boardUsers
          const currentUserId = currentSessionAfterConnect.user.id || 'current'
          const exists = boardUsers.some(u => u.id === currentUserId)
          if (exists) return boardUsers
          return [
            {
              id: currentUserId,
              name: currentSessionAfterConnect.user.name || 'You',
              email: currentSessionAfterConnect.user.email || '',
              avatar: currentSessionAfterConnect.user.image || undefined,
              isOnline: true,
              status: 'active' as const,
              currentBoard: board,
              currentBoardName: `Board ${board}`,
            },
            ...boardUsers,
          ]
        })()

        setCurrentUsers(withCurrentUser)
      }
    }, 1000)
  }, [])

  // 🔧 FIX: disconnect function is already stable with empty dependencies
  const disconnect = useCallback(() => {
    setMockSocket({ connected: false })
    setConnectionStatus('disconnected')
    setCurrentUsers([])
    setLatency(undefined)
  }, []) // ✅ Already stable

  const reconnect = useCallback(() => {
    setConnectionStatus('reconnecting')
    setTimeout(() => {
      connect()
    }, 2000)
  }, [connect])

  // 🔧 FIX: Make joinBoard stable by using refs
  const joinBoard = useCallback((boardId: string) => {
    setCurrentBoard(boardId)

    // Use ref to get current socket state
    const socket = mockSocketRef.current
    if (socket.connected) {
      // Filter users for the specific board
      const boardUsers = MOCK_USERS.filter(user => user.currentBoard === boardId)
      setCurrentUsers(boardUsers)

      // Add current user to the list if authenticated
      const currentSession = sessionRef.current
      if (currentSession?.user) {
        const currentUser: UserPresence = {
          id: currentSession.user.id || 'current',
          name: currentSession.user.name || 'You',
          email: currentSession.user.email || '',
          avatar: currentSession.user.image || undefined,
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
  }, [])

  const leaveBoard = useCallback(() => {
    setCurrentBoard(undefined)
    setCurrentUsers([])
  }, [])

  // 🔧 ULTIMATE FIX: Make updateUserStatus completely stable and safe
  const updateUserStatus = useCallback((status: 'active' | 'idle' | 'away') => {
    const currentSession = sessionRef.current
    if (!currentSession?.user) return

    setCurrentUsers(prev => {
      const userId = currentSession.user.id || 'current'
      const currentUser = prev.find(u => u.id === userId)

      // 🔧 CRITICAL: Only update if status actually changed to prevent unnecessary re-renders
      if (currentUser?.status === status) return prev

      return prev.map(user =>
        user.id === userId
          ? { ...user, status }
          : user
      )
    })
  }, []) // 🔧 EMPTY DEPENDENCIES - completely stable to prevent infinite loops

  // 🔧 FIX: Auto-connect when session is available - now with stable dependencies
  useEffect(() => {
    if (session) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [session, connect, disconnect]) // ✅ Now stable since connect/disconnect have empty deps

  // 🚨 ULTIMATE FIX: User activity detection with maximum stability
  useEffect(() => {
    // Only set up activity detection if user is authenticated
    if (!session?.user) return

    let idleTimer: NodeJS.Timeout
    let awayTimer: NodeJS.Timeout

    const resetTimers = () => {
      clearTimeout(idleTimer)
      clearTimeout(awayTimer)

      // 🔧 CRITICAL: Use ref to prevent infinite loops
      const currentSession = sessionRef.current
      if (!currentSession?.user) return

      // 🔧 SAFE UPDATE: Only update if status actually needs to change
      setCurrentUsers(prev => {
        const userId = currentSession.user.id || 'current'
        const currentUser = prev.find(u => u.id === userId)

        // If current user isn't present yet, do nothing to avoid unnecessary updates
        if (!currentUser) return prev

        // Only update if status is different to prevent unnecessary re-renders
        if (currentUser.status === 'active') return prev

        return prev.map(user =>
          user.id === userId
            ? { ...user, status: 'active' as const }
            : user
        )
      })

      // Set idle after 5 minutes of inactivity
      idleTimer = setTimeout(() => {
        const session = sessionRef.current
        if (!session?.user) return

        setCurrentUsers(prev => {
          const userId = session.user.id || 'current'
          const currentUser = prev.find(u => u.id === userId)
          if (!currentUser) return prev
          if (currentUser.status === 'idle') return prev

          return prev.map(user =>
            user.id === userId
              ? { ...user, status: 'idle' as const }
              : user
          )
        })

        // Set away after 15 minutes of inactivity
        awayTimer = setTimeout(() => {
          const session = sessionRef.current
          if (!session?.user) return

          setCurrentUsers(prev => {
            const userId = session.user.id || 'current'
            const currentUser = prev.find(u => u.id === userId)
            if (!currentUser) return prev
            if (currentUser.status === 'away') return prev

            return prev.map(user =>
              user.id === userId
                ? { ...user, status: 'away' as const }
                : user
            )
          })
        }, 10 * 60 * 1000) // 10 more minutes
      }, 5 * 60 * 1000) // 5 minutes
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']

    events.forEach(event => {
      document.addEventListener(event, resetTimers, true)
    })

    // 🚨 CRITICAL: Still don't call resetTimers immediately!
    // Let user interaction trigger the first status update

    return () => {
      clearTimeout(idleTimer)
      clearTimeout(awayTimer)
      events.forEach(event => {
        document.removeEventListener(event, resetTimers, true)
      })
    }
  }, [session]) // 🔧 ONLY depend on session, not updateUserStatus

  // 🔧 ULTIMATE FIX: Highly optimized context value memoization
  const value: CollaborationContextType = useMemo(() => ({
    isConnected: mockSocket.connected,
    connectionStatus,
    latency,
    currentUsers,
    currentBoard,
    joinBoard,
    leaveBoard,
    updateUserStatus,
    reconnect
  }), [
    mockSocket.connected,
    connectionStatus,
    latency,
    currentUsers,
    currentBoard,
    // 🔧 STABLE FUNCTIONS: These have empty dependencies so they're always stable
    joinBoard,
    leaveBoard,
    updateUserStatus,
    reconnect
  ])

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
