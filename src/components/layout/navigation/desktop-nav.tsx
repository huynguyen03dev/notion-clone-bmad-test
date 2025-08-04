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

interface DesktopNavProps {
  session: any
}

export function DesktopNav({ session }: DesktopNavProps) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        {/* Top Navigation Bar */}
        <div className="flex h-14 items-center justify-between">
          {/* Left Section - Logo and Board Switcher */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">K</span>
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search boards, tasks..."
                  className="pl-10 pr-4"
                />
              </div>
            </div>
          )}

          {/* Right Section - Actions and User Menu */}
          <div className="flex items-center space-x-2">
            {session ? (
              <>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Create new board</span>
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Bell className="h-4 w-4" />
                  <span className="sr-only">Notifications</span>
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
        </div>

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
