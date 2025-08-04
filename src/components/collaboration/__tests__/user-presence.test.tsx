import { render, screen } from '@testing-library/react'
import { UserPresenceIndicator, UserPresenceList, CollaborationStatus } from '../user-presence'
import type { UserPresence } from '../user-presence'

const mockUser: UserPresence = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  isOnline: true,
  status: 'active',
  currentBoard: 'board-1',
  currentBoardName: 'Test Board'
}

const mockOfflineUser: UserPresence = {
  id: '2',
  name: 'Jane Smith',
  email: 'jane@example.com',
  isOnline: false,
  lastSeen: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
  currentBoard: 'board-2',
  currentBoardName: 'Another Board'
}

describe('UserPresenceIndicator', () => {
  it('should render user avatar and name', () => {
    render(<UserPresenceIndicator user={mockUser} />)

    expect(screen.getByText('JD')).toBeInTheDocument() // Initials
    // Avatar fallback shows initials when no image is provided
    expect(screen.getByText('John Doe')).toBeInTheDocument() // In tooltip
  })

  it('should show online status indicator for online users', () => {
    render(<UserPresenceIndicator user={mockUser} />)
    
    // Check for online status indicator (green dot)
    const statusIndicator = document.querySelector('.bg-green-500')
    expect(statusIndicator).toBeInTheDocument()
  })

  it('should show offline status for offline users', () => {
    render(<UserPresenceIndicator user={mockOfflineUser} />)
    
    // Check for offline status indicator (gray dot)
    const statusIndicator = document.querySelector('.bg-gray-400')
    expect(statusIndicator).toBeInTheDocument()
  })

  it('should hide status indicator when showStatus is false', () => {
    render(<UserPresenceIndicator user={mockUser} showStatus={false} />)
    
    const statusIndicator = document.querySelector('.bg-green-500')
    expect(statusIndicator).not.toBeInTheDocument()
  })

  it('should render different sizes correctly', () => {
    const { rerender } = render(<UserPresenceIndicator user={mockUser} size="sm" />)
    expect(document.querySelector('.h-6.w-6')).toBeInTheDocument()

    rerender(<UserPresenceIndicator user={mockUser} size="lg" />)
    expect(document.querySelector('.h-10.w-10')).toBeInTheDocument()
  })
})

describe('UserPresenceList', () => {
  const mockUsers: UserPresence[] = [mockUser, mockOfflineUser]

  it('should render multiple users', () => {
    render(<UserPresenceList users={mockUsers} />)
    
    expect(screen.getByText('JD')).toBeInTheDocument()
    expect(screen.getByText('JS')).toBeInTheDocument()
  })

  it('should limit visible users and show count', () => {
    const manyUsers = Array.from({ length: 10 }, (_, i) => ({
      ...mockUser,
      id: `user-${i}`,
      name: `User ${i}`
    }))

    render(<UserPresenceList users={manyUsers} maxVisible={3} />)
    
    // Should show +7 for remaining users
    expect(screen.getByText('+7')).toBeInTheDocument()
  })

  it('should not show count when users fit within limit', () => {
    render(<UserPresenceList users={mockUsers} maxVisible={5} />)
    
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument()
  })
})

describe('CollaborationStatus', () => {
  it('should show connected status', () => {
    render(<CollaborationStatus isConnected={true} userCount={3} />)
    
    expect(screen.getByText('Connected')).toBeInTheDocument()
    expect(screen.getByText('3 online')).toBeInTheDocument()
  })

  it('should show disconnected status', () => {
    render(<CollaborationStatus isConnected={false} userCount={0} />)
    
    expect(screen.getByText('Disconnected')).toBeInTheDocument()
    expect(screen.queryByText('online')).not.toBeInTheDocument()
  })

  it('should show correct connection indicator color', () => {
    const { rerender } = render(<CollaborationStatus isConnected={true} userCount={1} />)
    expect(document.querySelector('.bg-green-500')).toBeInTheDocument()

    rerender(<CollaborationStatus isConnected={false} userCount={0} />)
    expect(document.querySelector('.bg-red-500')).toBeInTheDocument()
  })
})
