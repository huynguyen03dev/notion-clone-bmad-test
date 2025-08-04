import { render, screen } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { DesktopNav } from '../desktop-nav'
import { ThemeProvider } from '@/components/theme/theme-provider'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

// Mock the UserMenu component
vi.mock('@/components/auth/UserMenu', () => ({
  UserMenu: () => <div data-testid="user-menu">User Menu</div>
}))

// Mock the BoardSwitcher component
vi.mock('../board-switcher', () => ({
  BoardSwitcher: () => <div data-testid="board-switcher">Board Switcher</div>
}))

// Mock the Breadcrumbs component
vi.mock('../breadcrumbs', () => ({
  Breadcrumbs: () => <div data-testid="breadcrumbs">Breadcrumbs</div>
}))

const mockUsePathname = usePathname as vi.MockedFunction<typeof usePathname>

function renderWithTheme(component: React.ReactElement) {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  )
}

describe('DesktopNav', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/')
  })

  it('renders logo and app name', () => {
    renderWithTheme(<DesktopNav session={null} />)
    
    expect(screen.getByText('Kanban Board')).toBeInTheDocument()
  })

  it('shows sign in and get started buttons when not authenticated', () => {
    renderWithTheme(<DesktopNav session={null} />)
    
    expect(screen.getByText('Sign In')).toBeInTheDocument()
    expect(screen.getByText('Get Started')).toBeInTheDocument()
  })

  it('shows authenticated navigation when user is signed in', () => {
    const mockSession = {
      user: {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com'
      }
    }

    renderWithTheme(<DesktopNav session={mockSession} />)
    
    expect(screen.getByTestId('board-switcher')).toBeInTheDocument()
    expect(screen.getByTestId('user-menu')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search boards, tasks...')).toBeInTheDocument()
  })

  it('shows breadcrumbs when authenticated and not on home page', () => {
    mockUsePathname.mockReturnValue('/dashboard')
    
    const mockSession = {
      user: {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com'
      }
    }

    renderWithTheme(<DesktopNav session={mockSession} />)
    
    expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument()
  })

  it('does not show breadcrumbs on home page', () => {
    mockUsePathname.mockReturnValue('/')
    
    const mockSession = {
      user: {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com'
      }
    }

    renderWithTheme(<DesktopNav session={mockSession} />)
    
    expect(screen.queryByTestId('breadcrumbs')).not.toBeInTheDocument()
  })

  it('includes theme toggle button', () => {
    renderWithTheme(<DesktopNav session={null} />)
    
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
  })

  it('shows action buttons when authenticated', () => {
    const mockSession = {
      user: {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com'
      }
    }

    renderWithTheme(<DesktopNav session={mockSession} />)
    
    expect(screen.getByRole('button', { name: /create new board/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument()
  })
})
