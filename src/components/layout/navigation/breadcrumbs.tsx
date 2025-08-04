'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
}

export function Breadcrumbs() {
  const pathname = usePathname()

  // Generate breadcrumb items based on current path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = []

    // Always start with Dashboard for authenticated routes
    breadcrumbs.push({
      label: 'Dashboard',
      href: '/dashboard',
      current: pathname === '/dashboard'
    })

    // Handle specific routes
    if (segments.includes('profile')) {
      breadcrumbs.push({
        label: 'Profile',
        current: true
      })
    } else if (segments.includes('boards')) {
      breadcrumbs.push({
        label: 'Boards',
        href: '/boards',
        current: pathname === '/boards'
      })

      // If we're viewing a specific board
      if (segments.length > 2) {
        const boardId = segments[2]
        breadcrumbs.push({
          label: `Board ${boardId}`, // This would be replaced with actual board name
          current: true
        })
      }
    } else if (segments.includes('search')) {
      breadcrumbs.push({
        label: 'Search',
        current: true
      })
    }

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  if (breadcrumbs.length <= 1) {
    return null
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-1 text-sm">
      <Home className="h-4 w-4 text-muted-foreground" />
      
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center space-x-1">
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          
          {item.current ? (
            <span className="font-medium text-foreground">
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href!}
              className={cn(
                'text-muted-foreground hover:text-foreground transition-colors',
                'hover:underline'
              )}
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}
