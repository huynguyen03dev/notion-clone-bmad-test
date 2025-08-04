'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, Plus, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { UserMenu } from '@/components/auth/UserMenu'
import { BoardSwitcher } from './board-switcher'
import { Breadcrumbs } from './breadcrumbs'
import { useAccessibleNav } from '@/components/accessibility/aria-utils'
import { UserPresenceList } from '@/components/collaboration/user-presence'
import { WebSocketStatusIndicator } from '@/components/collaboration/websocket-status'
import { useCollaboration } from '@/components/collaboration/collaboration-provider'

interface DesktopNavProps {
  session: any
}

export function DesktopNav({ session }: DesktopNavProps) {
  const pathname = usePathname()
  const { navProps } = useAccessibleNav({
    label: 'Main navigation',
    current: pathname
  })
  const { currentUsers, connectionStatus, reconnect } = useCollaboration()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        {/* Top Navigation Bar */}
        <nav {...navProps} className="flex h-14 items-center justify-between" id="navigation">
          {/* Left Section - Logo and Board Switcher */}
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md"
              aria-label="Kanban Board - Go to home page"
            >
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm" aria-hidden="true">K</span>
              </div>
              <span className="font-bold text-lg">Kanban Board</span>
            </Link>
            
            {session && (
              <>
                <div className="h-6 w-px bg-border" />
                <BoardSwitcher />
              </>
            )}
          </div>

          {/* Center Section - Search */}
          {session && (
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder="Search boards, tasks..."
                  className="pl-10 pr-4"
                  aria-label="Search boards and tasks"
                  role="searchbox"
                />
              </div>
            </div>
          )}

          {/* Right Section - Actions and User Menu */}
          <div className="flex items-center space-x-2">
            {session ? (
              <>
                {/* Collaboration indicators */}
                <div className="flex items-center space-x-3 mr-2">
                  <UserPresenceList
                    users={currentUsers}
                    maxVisible={3}
                    size="sm"
                  />
                  <WebSocketStatusIndicator
                    status={connectionStatus}
                    onReconnect={reconnect}
                    compact
                    showText={false}
                  />
                </div>

                <div className="h-6 w-px bg-border" />

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  aria-label="Create new board"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  aria-label="View notifications"
                >
                  <Bell className="h-4 w-4" aria-hidden="true" />
                </Button>
                <ThemeToggle />
                <UserMenu />
              </>
            ) : (
              <>
                <ThemeToggle />
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/signin">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </nav>

        {/* Breadcrumbs */}
        {session && pathname !== '/' && (
          <div className="py-2 border-t">
            <Breadcrumbs />
          </div>
        )}
      </div>
    </header>
  )
}
