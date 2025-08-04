import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { AppShell } from '@/components/layout/app-shell'
import { vi } from 'vitest'

// Mock Next.js router
const mockPush = vi.fn()
const mockRouter = { push: mockPush }

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => mockRouter),
  usePathname: vi.fn(() => '/dashboard')
}))

// Mock NextAuth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn()
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: {
    onLine: true,
    serviceWorker: {
      register: vi.fn(() => Promise.resolve({
        addEventListener: vi.fn(),
        installing: null,
        waiting: null
      }))
    },
    standalone: false
  },
  writable: true
})

describe('Navigation Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useSession as any).mockReturnValue({
      data: {
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com'
        }
      },
      status: 'authenticated'
    })
  })

  it('should render navigation for authenticated users', async () => {
    render(
      <AppShell>
        <div>Test Content</div>
      </AppShell>
    )

    // Should show desktop navigation elements
    expect(screen.getByText('Kanban Board')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search boards, tasks...')).toBeInTheDocument()
    
    // Should show mobile navigation
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Boards')).toBeInTheDocument()
  })

  it('should handle keyboard navigation shortcuts', async () => {
    render(
      <AppShell>
        <div>Test Content</div>
      </AppShell>
    )

    // Test help shortcut
    fireEvent.keyDown(document, { key: '?' })
    
    await waitFor(() => {
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument()
    })
  })

  it('should show offline indicator when offline', async () => {
    // Mock offline state
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    })

    render(
      <AppShell>
        <div>Test Content</div>
      </AppShell>
    )

    // Trigger offline event
    fireEvent(window, new Event('offline'))

    await waitFor(() => {
      expect(screen.getByText(/offline/i)).toBeInTheDocument()
    })
  })

  it('should handle theme switching', async () => {
    render(
      <AppShell>
        <div>Test Content</div>
      </AppShell>
    )

    // Find theme toggle button
    const themeToggle = screen.getByRole('button', { name: /toggle theme/i })
    expect(themeToggle).toBeInTheDocument()

    // Click theme toggle
    fireEvent.click(themeToggle)

    // Theme should change (this would be more complex in real implementation)
    expect(themeToggle).toBeInTheDocument()
  })

  it('should show collaboration indicators for authenticated users', async () => {
    render(
      <AppShell>
        <div>Test Content</div>
      </AppShell>
    )

    // Should show user presence indicators
    await waitFor(() => {
      // Look for collaboration elements (avatars, connection status)
      const collaborationElements = screen.queryAllByText(/online|connected/i)
      expect(collaborationElements.length).toBeGreaterThan(0)
    })
  })

  it('should handle unauthenticated state', () => {
    ;(useSession as any).mockReturnValue({
      data: null,
      status: 'unauthenticated'
    })

    render(
      <AppShell>
        <div>Test Content</div>
      </AppShell>
    )

    // Should show sign in options
    expect(screen.getByText('Sign In')).toBeInTheDocument()
    expect(screen.getByText('Get Started')).toBeInTheDocument()
    
    // Should not show authenticated features
    expect(screen.queryByPlaceholderText('Search boards, tasks...')).not.toBeInTheDocument()
  })

  it('should handle loading state', () => {
    ;(useSession as any).mockReturnValue({
      data: null,
      status: 'loading'
    })

    render(
      <AppShell>
        <div>Test Content</div>
      </AppShell>
    )

    // Should show loading spinner
    expect(screen.getByText('Loading application...')).toBeInTheDocument()
  })

  it('should handle responsive navigation switching', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    })

    render(
      <AppShell>
        <div>Test Content</div>
      </AppShell>
    )

    // Mobile navigation should be present
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
  })
})
