'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { DesktopNav } from './navigation/desktop-nav'
import { MobileNav } from './navigation/mobile-nav'
import { Footer } from './footer'
import { AuthGuard } from '@/components/auth/AuthGuard'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { data: session, status } = useSession()
  const pathname = usePathname()

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // For auth routes, show minimal layout
  if (isAuthRoute) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b bg-background">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-center">
              <h1 className="text-xl font-bold">Kanban Board</h1>
            </div>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          {children}
        </main>
        <Footer />
      </div>
    )
  }

  // For protected routes, wrap with AuthGuard
  if (isProtectedRoute) {
    return (
      <AuthGuard>
        <AppShellContent session={session}>
          {children}
        </AppShellContent>
      </AuthGuard>
    )
  }

  // For public routes, show full layout
  return (
    <AppShellContent session={session}>
      {children}
    </AppShellContent>
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
      <main className="flex-1 pb-16 md:pb-0">
        <div className="container mx-auto px-4 py-6">
          {children}
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
