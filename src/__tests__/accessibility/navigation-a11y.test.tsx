import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { DesktopNav } from '@/components/layout/navigation/desktop-nav'
import { MobileNav } from '@/components/layout/navigation/mobile-nav'
import { Breadcrumbs } from '@/components/layout/navigation/breadcrumbs'
import { UserPresenceIndicator } from '@/components/collaboration/user-presence'
import { InstallPrompt } from '@/components/pwa/install-prompt'
import { vi } from 'vitest'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

// Mock Next.js hooks
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard'),
  useRouter: vi.fn(() => ({ push: vi.fn() }))
}))

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: { user: { id: '1', name: 'Test User', email: 'test@example.com' } }
  }))
}))

// Mock collaboration hook
vi.mock('@/components/collaboration/collaboration-provider', () => ({
  useCollaboration: vi.fn(() => ({
    currentUsers: [],
    connectionStatus: 'connected',
    reconnect: vi.fn()
  }))
}))

// Mock PWA hook
vi.mock('@/components/pwa/pwa-provider', () => ({
  usePWA: vi.fn(() => ({
    isInstallable: false,
    isInstalled: false,
    installApp: vi.fn()
  }))
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

describe('Navigation Accessibility Tests', () => {
  it('should not have accessibility violations in desktop navigation', async () => {
    const mockSession = {
      user: { id: '1', name: 'Test User', email: 'test@example.com' }
    }

    const { container } = render(<DesktopNav session={mockSession} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should not have accessibility violations in mobile navigation', async () => {
    const mockSession = {
      user: { id: '1', name: 'Test User', email: 'test@example.com' }
    }

    const { container } = render(<MobileNav session={mockSession} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should not have accessibility violations in breadcrumbs', async () => {
    const { container } = render(<Breadcrumbs />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should not have accessibility violations in user presence indicator', async () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      isOnline: true,
      status: 'active' as const
    }

    const { container } = render(<UserPresenceIndicator user={mockUser} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should not have accessibility violations in install prompt', async () => {
    const { container } = render(<InstallPrompt variant="card" />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should have proper ARIA labels in navigation', () => {
    const mockSession = {
      user: { id: '1', name: 'Test User', email: 'test@example.com' }
    }

    const { container } = render(<DesktopNav session={mockSession} />)
    
    // Check for navigation landmark
    const nav = container.querySelector('nav')
    expect(nav).toHaveAttribute('aria-label', 'Main navigation')
    
    // Check for search input accessibility
    const searchInput = container.querySelector('input[placeholder*="Search"]')
    expect(searchInput).toHaveAttribute('aria-label', 'Search boards and tasks')
    expect(searchInput).toHaveAttribute('role', 'searchbox')
  })

  it('should have proper focus management', () => {
    const mockSession = {
      user: { id: '1', name: 'Test User', email: 'test@example.com' }
    }

    const { container } = render(<DesktopNav session={mockSession} />)
    
    // Check that interactive elements are focusable
    const buttons = container.querySelectorAll('button')
    buttons.forEach(button => {
      expect(button).not.toHaveAttribute('tabindex', '-1')
    })

    const links = container.querySelectorAll('a')
    links.forEach(link => {
      expect(link).not.toHaveAttribute('tabindex', '-1')
    })
  })

  it('should have proper heading hierarchy', () => {
    const { container } = render(<Breadcrumbs />)
    
    // Breadcrumbs should not interfere with heading hierarchy
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
    // Should not have any headings in breadcrumbs component
    expect(headings).toHaveLength(0)
  })

  it('should have proper color contrast', async () => {
    const mockSession = {
      user: { id: '1', name: 'Test User', email: 'test@example.com' }
    }

    const { container } = render(<DesktopNav session={mockSession} />)
    
    // Run axe with color contrast rules
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true }
      }
    })
    
    expect(results).toHaveNoViolations()
  })

  it('should support keyboard navigation', () => {
    const mockSession = {
      user: { id: '1', name: 'Test User', email: 'test@example.com' }
    }

    const { container } = render(<MobileNav session={mockSession} />)
    
    // All interactive elements should be keyboard accessible
    const interactiveElements = container.querySelectorAll('button, a, input, [tabindex]')
    
    interactiveElements.forEach(element => {
      // Should not have negative tabindex (unless specifically intended)
      const tabIndex = element.getAttribute('tabindex')
      if (tabIndex !== null) {
        expect(parseInt(tabIndex)).toBeGreaterThanOrEqual(0)
      }
    })
  })

  it('should have proper semantic HTML structure', () => {
    const mockSession = {
      user: { id: '1', name: 'Test User', email: 'test@example.com' }
    }

    const { container } = render(<DesktopNav session={mockSession} />)
    
    // Should have proper semantic structure
    expect(container.querySelector('header')).toBeInTheDocument()
    expect(container.querySelector('nav')).toBeInTheDocument()
    
    // Logo should be a link
    const logoLink = container.querySelector('a[href="/"]')
    expect(logoLink).toBeInTheDocument()
    expect(logoLink).toHaveAttribute('aria-label')
  })
})
