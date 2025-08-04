'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, User, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
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
    <motion.nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="flex items-center justify-around py-2">
        {navItems.map((item, index) => {
          const Icon = item.icon
          return (
            <motion.div
              key={item.href}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <Button
                variant="ghost"
                size="sm"
                asChild
                className={cn(
                  'flex flex-col items-center space-y-1 h-auto py-2 px-3 relative',
                  'transition-colors duration-200',
                  item.active && 'text-primary'
                )}
              >
                <Link href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center space-y-1"
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs">{item.label}</span>
                  </motion.div>
                  {item.active && (
                    <motion.div
                      className="absolute -top-1 left-1/2 w-1 h-1 bg-primary rounded-full"
                      layoutId="activeTab"
                      style={{ x: '-50%' }}
                    />
                  )}
                </Link>
              </Button>
            </motion.div>
          )
        })}
      </div>
    </motion.nav>
  )
}
