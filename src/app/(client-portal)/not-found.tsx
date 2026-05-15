import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <h2 className="text-xl font-semibold mb-2">Page not found</h2>
      <p className="text-muted-foreground mb-4">The page you are looking for does not exist.</p>
      <Link
        href="/portal/dashboard"
        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-2"
      >
        Go to Dashboard
      </Link>
    </div>
  )
}
