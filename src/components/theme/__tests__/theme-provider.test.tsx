import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ThemeProvider, useTheme } from '../theme-provider'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Test component that uses the theme
function TestComponent() {
  const { theme, setTheme } = useTheme()
  
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button onClick={() => setTheme('dark')} data-testid="set-dark">
        Set Dark
      </button>
      <button onClick={() => setTheme('light')} data-testid="set-light">
        Set Light
      </button>
      <button onClick={() => setTheme('system')} data-testid="set-system">
        Set System
      </button>
    </div>
  )
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    document.documentElement.className = ''
  })

  it('renders with default theme', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('system')
    })
  })

  it('loads theme from localStorage', async () => {
    localStorageMock.getItem.mockReturnValue('dark')

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
    })
  })

  it('changes theme and saves to localStorage', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('set-dark'))

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('kanban-ui-theme', 'dark')
    })
  })

  it('applies theme class to document element', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('set-light'))

    await waitFor(() => {
      expect(document.documentElement.classList.contains('light')).toBe(true)
    })
  })

  it('handles system theme preference', async () => {
    // Mock matchMedia for system theme detection
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('set-system'))

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })

  it('throws error when used outside provider', () => {
    // Create a component that directly uses useTheme without provider
    function DirectTestComponent() {
      const { theme } = useTheme()
      return <span data-testid="direct-theme">{theme}</span>
    }

    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<DirectTestComponent />)
    }).toThrow('useTheme must be used within a ThemeProvider')

    consoleSpy.mockRestore()
  })
})
