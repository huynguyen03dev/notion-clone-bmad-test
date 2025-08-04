'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { DesktopNav } from './navigation/desktop-nav'
import { MobileNav } from './navigation/mobile-nav'
import { Footer } from './footer'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { PageTransition } from './animations/page-transition'
import { LoadingSpinner } from './loading/loading-spinner'
import { SkipLinks } from '@/components/accessibility/skip-links'
import { useKeyboardShortcuts } from '@/components/accessibility/keyboard-shortcuts'
import { useKeyboardShortcutsHelp } from '@/components/accessibility/keyboard-shortcuts-help'
import { useFocusRestoration } from '@/components/accessibility/focus-management'
import { InstallPrompt, OfflineIndicator, UpdatePrompt } from '@/components/pwa/install-prompt'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const { focusMainContent } = useFocusRestoration()
  const { showHelp, KeyboardShortcutsHelpModal } = useKeyboardShortcutsHelp()

  // Set up keyboard shortcuts
  useKeyboardShortcuts({
    onShowHelp: showHelp,
    onGlobalSearch: () => {
      const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
      if (searchInput) {
        searchInput.focus()
      }
    },
    onCreateBoard: () => {
      // This will be implemented when create board functionality is added
      console.log('Create board shortcut triggered')
    },
    onCreateTask: () => {
      // This will be implemented when create task functionality is added
      console.log('Create task shortcut triggered')
    }
  })

  // Check if current route is an auth route
  const isAuthRoute = pathname?.startsWith('/signin') ||
                     pathname?.startsWith('/register') ||
                     pathname?.startsWith('/forgot-password') ||
                     pathname?.startsWith('/reset-password')

  // Check if current route requires authentication
  const isProtectedRoute = pathname?.startsWith('/dashboard') ||
                          pathname?.startsWith('/profile') ||
                          pathname?.startsWith('/boards')

  // Show loading state during session check
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading application..." />
      </div>
    )
  }

  // For auth routes, show minimal layout
  if (isAuthRoute) {
    return (
      <>
        <SkipLinks />
        <div className="min-h-screen flex flex-col">
          <header className="border-b bg-background">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-center">
                <h1 className="text-xl font-bold">Kanban Board</h1>
              </div>
            </div>
          </header>
          <main className="flex-1 flex items-center justify-center" id="main-content">
            {children}
          </main>
          <Footer />
        </div>
        <KeyboardShortcutsHelpModal />
      </>
    )
  }

  // For protected routes, wrap with AuthGuard
  if (isProtectedRoute) {
    return (
      <>
        <SkipLinks />
        <OfflineIndicator />
        <InstallPrompt variant="banner" />
        <AuthGuard>
          <AppShellContent session={session}>
            {children}
          </AppShellContent>
        </AuthGuard>
        <KeyboardShortcutsHelpModal />
        <UpdatePrompt />
      </>
    )
  }

  // For public routes, show full layout
  return (
    <>
      <SkipLinks />
      <OfflineIndicator />
      <InstallPrompt variant="banner" />
      <AppShellContent session={session}>
        {children}
      </AppShellContent>
      <KeyboardShortcutsHelpModal />
      <UpdatePrompt />
    </>
  )
}

interface AppShellContentProps {
  children: React.ReactNode
  session: any
}

function AppShellContent({ children, session }: AppShellContentProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Desktop Navigation */}
      <div className="hidden md:block">
        <DesktopNav session={session} />
      </div>

      {/* Main Content */}
      <main className="flex-1 pb-16 md:pb-0" id="main-content">
        <div className="container mx-auto px-4 py-6">
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </main>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <MobileNav session={session} />
      </div>

      {/* Footer - only on desktop */}
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  )
}
