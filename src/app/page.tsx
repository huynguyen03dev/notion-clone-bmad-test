'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/layout/loading/loading-spinner'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (status === 'loading') return // Still loading session
    
    if (session) {
      router.push('/dashboard')
    }
  }, [session, status, router])

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    )
  }

  // Show loading state while redirecting authenticated users
  if (session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <LoadingSpinner size="lg" text="Redirecting to dashboard..." />
      </div>
    )
  }

  // Show landing page only for unauthenticated users
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to Kanban Board</h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
        A modern, collaborative kanban board application built with Next.js,
        TypeScript, and TailwindCSS. Organize your projects and collaborate
        with your team in real-time.
      </p>
      <div className="flex gap-4">
        <Button size="lg" asChild>
          <Link href="/register">Get Started</Link>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link href="/signin">Sign In</Link>
        </Button>
      </div>
    </div>
  )
}
