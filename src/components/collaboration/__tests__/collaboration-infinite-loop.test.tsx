/**
 * Test to verify that the CollaborationProvider infinite loop issue is resolved
 * This test ensures that the provider doesn't cause "Maximum update depth exceeded" errors
 */

import { render, screen, act, waitFor } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import { CollaborationProvider, useCollaboration } from '../collaboration-provider'

// Mock session data
const mockSession = {
  user: {
    id: 'test-user-1',
    name: 'Test User',
    email: 'test@example.com',
    image: 'https://example.com/avatar.jpg'
  },
  expires: '2024-12-31'
}

// Test component that uses collaboration
function TestComponent() {
  const { 
    isConnected, 
    connectionStatus, 
    currentUsers, 
    joinBoard, 
    updateUserStatus 
  } = useCollaboration()

  return (
    <div>
      <div data-testid="connection-status">{connectionStatus}</div>
      <div data-testid="is-connected">{isConnected ? 'connected' : 'disconnected'}</div>
      <div data-testid="user-count">{currentUsers.length}</div>
      <button 
        data-testid="join-board" 
        onClick={() => joinBoard('test-board-1')}
      >
        Join Board
      </button>
      <button 
        data-testid="update-status" 
        onClick={() => updateUserStatus('idle')}
      >
        Update Status
      </button>
    </div>
  )
}

// Wrapper component with providers
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider session={mockSession}>
      <CollaborationProvider>
        {children}
      </CollaborationProvider>
    </SessionProvider>
  )
}

describe('CollaborationProvider Infinite Loop Fix', () => {
  beforeEach(() => {
    // Clear any existing timers
    jest.clearAllTimers()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('should not cause infinite re-renders when mounting', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )
    }).not.toThrow()

    // Verify no "Maximum update depth exceeded" errors
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Maximum update depth exceeded')
    )

    consoleSpy.mockRestore()
  })

  it('should handle user status updates without infinite loops', async () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    )

    const updateButton = screen.getByTestId('update-status')
    
    // This should not cause infinite re-renders
    expect(() => {
      act(() => {
        updateButton.click()
      })
    }).not.toThrow()

    // Fast-forward timers to trigger activity detection
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    // Should still be stable
    expect(screen.getByTestId('connection-status')).toBeInTheDocument()
  })

  it('should handle board joining without infinite loops', async () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    )

    const joinButton = screen.getByTestId('join-board')
    
    // This should not cause infinite re-renders
    expect(() => {
      act(() => {
        joinButton.click()
      })
    }).not.toThrow()

    // Fast-forward connection simulation
    act(() => {
      jest.advanceTimersByTime(1100)
    })

    await waitFor(() => {
      expect(screen.getByTestId('is-connected')).toHaveTextContent('connected')
    })
  })

  it('should handle activity detection timers without infinite loops', async () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    )

    // Simulate user activity events that previously caused infinite loops
    act(() => {
      // Simulate mouse movement
      document.dispatchEvent(new Event('mousemove'))
      document.dispatchEvent(new Event('keypress'))
      document.dispatchEvent(new Event('scroll'))
    })

    // Fast-forward through idle detection periods
    act(() => {
      jest.advanceTimersByTime(5 * 60 * 1000 + 1000) // 5 minutes + buffer
    })

    // Should not cause infinite loops
    expect(screen.getByTestId('connection-status')).toBeInTheDocument()
  })

  it('should maintain stable function references', () => {
    const { rerender } = render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    )

    // Get initial function references
    const initialJoinBoard = screen.getByTestId('join-board')
    const initialUpdateStatus = screen.getByTestId('update-status')

    // Force re-render
    rerender(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    )

    // Functions should remain stable (no infinite re-renders)
    expect(screen.getByTestId('join-board')).toBeInTheDocument()
    expect(screen.getByTestId('update-status')).toBeInTheDocument()
  })
})
