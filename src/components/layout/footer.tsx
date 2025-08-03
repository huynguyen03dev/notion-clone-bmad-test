export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            © 2025 Kanban Board App. Built with Next.js and TypeScript.
          </p>
          <div className="flex items-center space-x-4">
            <a
              href="/api/health"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              System Status
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
