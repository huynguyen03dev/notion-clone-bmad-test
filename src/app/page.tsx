import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
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
