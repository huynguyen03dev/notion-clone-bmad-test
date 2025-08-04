import { renderHook, act } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useKeyboardShortcuts } from '../keyboard-shortcuts'
import { vi } from 'vitest'

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}))

vi.mock('next-auth/react', () => ({
  useSession: vi.fn()
}))

const mockPush = vi.fn()
const mockRouter = { push: mockPush }

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as any).mockReturnValue(mockRouter)
    ;(useSession as any).mockReturnValue({ data: { user: { id: '1' } } })
    
    // Mock document methods
    Object.defineProperty(document, 'addEventListener', {
      value: vi.fn(),
      writable: true
    })
    Object.defineProperty(document, 'removeEventListener', {
      value: vi.fn(),
      writable: true
    })
  })

  it('should return filtered shortcuts based on authentication', () => {
    const { result } = renderHook(() => useKeyboardShortcuts())

    expect(result.current.shortcuts).toHaveLength(9) // All shortcuts for authenticated user
    expect(result.current.shortcuts.some(s => s.key === 'g d')).toBe(true)
  })

  it('should return only non-auth shortcuts for unauthenticated users', () => {
    ;(useSession as any).mockReturnValue({ data: null })
    
    const { result } = renderHook(() => useKeyboardShortcuts())
    
    expect(result.current.shortcuts).toHaveLength(2) // Only general shortcuts
    expect(result.current.shortcuts.every(s => !s.requiresAuth)).toBe(true)
  })

  it('should handle navigation shortcuts', () => {
    const { result } = renderHook(() => useKeyboardShortcuts())
    
    // Find the dashboard shortcut
    const dashboardShortcut = result.current.shortcuts.find(s => s.key === 'g d')
    expect(dashboardShortcut).toBeDefined()
    
    // Execute the shortcut
    act(() => {
      dashboardShortcut!.action()
    })
    
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('should call callback functions when provided', () => {
    const mockShowHelp = vi.fn()
    const mockGlobalSearch = vi.fn()
    
    const { result } = renderHook(() => 
      useKeyboardShortcuts({
        onShowHelp: mockShowHelp,
        onGlobalSearch: mockGlobalSearch
      })
    )
    
    // Find and execute help shortcut
    const helpShortcut = result.current.shortcuts.find(s => s.key === '?')
    act(() => {
      helpShortcut!.action()
    })
    
    expect(mockShowHelp).toHaveBeenCalled()
  })

  it('should enable/disable shortcuts', () => {
    const { result } = renderHook(() => useKeyboardShortcuts())
    
    expect(result.current.isEnabled).toBe(true)
    
    act(() => {
      result.current.setIsEnabled(false)
    })
    
    expect(result.current.isEnabled).toBe(false)
  })

  it('should categorize shortcuts correctly', () => {
    const { result } = renderHook(() => useKeyboardShortcuts())
    
    const navigationShortcuts = result.current.shortcuts.filter(s => s.category === 'navigation')
    const actionShortcuts = result.current.shortcuts.filter(s => s.category === 'actions')
    const generalShortcuts = result.current.shortcuts.filter(s => s.category === 'general')
    
    expect(navigationShortcuts.length).toBeGreaterThan(0)
    expect(actionShortcuts.length).toBeGreaterThan(0)
    expect(generalShortcuts.length).toBeGreaterThan(0)
  })
})
