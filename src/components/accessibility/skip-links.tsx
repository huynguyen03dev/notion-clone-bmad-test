'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

export function SkipLinks() {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <Link
        href="#main-content"
        className={cn(
          'absolute top-4 left-4 z-50 px-4 py-2 bg-primary text-primary-foreground',
          'rounded-md font-medium text-sm',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'transform -translate-y-full focus:translate-y-0 transition-transform'
        )}
      >
        Skip to main content
      </Link>
      <Link
        href="#navigation"
        className={cn(
          'absolute top-4 left-32 z-50 px-4 py-2 bg-primary text-primary-foreground',
          'rounded-md font-medium text-sm',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'transform -translate-y-full focus:translate-y-0 transition-transform'
        )}
      >
        Skip to navigation
      </Link>
    </div>
  )
}
