import { renderHook, act } from '@testing-library/react'
import { render, screen } from '@testing-library/react'
import { PWAProvider, usePWA } from '../pwa-provider'
import { vi } from 'vitest'

// Mock navigator and window objects
const mockNavigator = {
  onLine: true,
  serviceWorker: {
    register: vi.fn(),
    controller: null
  },
  standalone: false
}

const mockWindow = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  matchMedia: vi.fn(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  })),
  navigator: mockNavigator
}

Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true
})

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true
})

// Mock Notification
Object.defineProperty(global, 'Notification', {
  value: {
    permission: 'default',
    requestPermission: vi.fn(() => Promise.resolve('granted'))
  },
  writable: true
})

const TestComponent = ({ children }: { children: React.ReactNode }) => (
  <PWAProvider>{children}</PWAProvider>
)

describe('PWAProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigator.onLine = true
    mockNavigator.serviceWorker.register.mockResolvedValue({
      addEventListener: vi.fn(),
      installing: null,
      waiting: null
    })
  })

  it('should provide PWA context values', () => {
    const { result } = renderHook(() => usePWA(), {
      wrapper: TestComponent
    })

    expect(result.current.isOnline).toBe(true)
    expect(result.current.isServiceWorkerSupported).toBe(true)
    expect(result.current.isInstallable).toBe(false)
    expect(result.current.isInstalled).toBe(false)
    expect(result.current.hasUpdate).toBe(false)
    expect(result.current.notificationPermission).toBe('default')
  })

  it('should handle online/offline status', () => {
    const { result } = renderHook(() => usePWA(), {
      wrapper: TestComponent
    })

    expect(result.current.isOnline).toBe(true)

    // Simulate going offline
    act(() => {
      mockNavigator.onLine = false
      const offlineHandler = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'offline'
      )?.[1]
      if (offlineHandler) offlineHandler()
    })

    expect(result.current.isOnline).toBe(false)
  })

  it('should register service worker when supported', async () => {
    renderHook(() => usePWA(), {
      wrapper: TestComponent
    })

    // Wait for service worker registration
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(mockNavigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js')
  })

  it('should handle notification permission request', async () => {
    const { result } = renderHook(() => usePWA(), {
      wrapper: TestComponent
    })

    // Test that the function exists and returns a permission value
    await act(async () => {
      const permission = await result.current.requestNotificationPermission()
      expect(['granted', 'denied', 'default']).toContain(permission)
    })

    expect(typeof result.current.requestNotificationPermission).toBe('function')
  })

  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => usePWA())
    }).toThrow('usePWA must be used within a PWAProvider')
  })
})

describe('PWA Context Integration', () => {
  it('should provide context to child components', () => {
    const TestChild = () => {
      const { isOnline, isServiceWorkerSupported } = usePWA()
      return (
        <div>
          <span data-testid="online-status">{isOnline ? 'online' : 'offline'}</span>
          <span data-testid="sw-support">{isServiceWorkerSupported ? 'supported' : 'not-supported'}</span>
        </div>
      )
    }

    render(
      <PWAProvider>
        <TestChild />
      </PWAProvider>
    )

    expect(screen.getByTestId('online-status')).toHaveTextContent('online')
    expect(screen.getByTestId('sw-support')).toHaveTextContent('supported')
  })
})
