'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, User, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface MobileNavProps {
  session: any
}

export function MobileNav({ session }: MobileNavProps) {
  const pathname = usePathname()

  if (!session) {
    return null
  }

  const navItems = [
    {
      href: '/dashboard',
      icon: Home,
      label: 'Dashboard',
      active: pathname === '/dashboard'
    },
    {
      href: '/boards',
      icon: Plus,
      label: 'Boards',
      active: pathname?.startsWith('/boards')
    },
    {
      href: '/search',
      icon: Search,
      label: 'Search',
      active: pathname === '/search'
    },
    {
      href: '/profile',
      icon: User,
      label: 'Profile',
      active: pathname === '/profile'
    }
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.href}
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                'flex flex-col items-center space-y-1 h-auto py-2 px-3',
                item.active && 'text-primary'
              )}
            >
              <Link href={item.href}>
                <Icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            </Button>
          )
        })}
      </div>
    </nav>
  )
}
