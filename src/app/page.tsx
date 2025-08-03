import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Kanban Board</h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
          A modern, collaborative kanban board application built with Next.js,
          TypeScript, and TailwindCSS. Organize your projects and collaborate
          with your team in real-time.
        </p>
        <div className="flex gap-4">
          <Button size="lg">Get Started</Button>
          <Button variant="outline" size="lg">
            Learn More
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}
