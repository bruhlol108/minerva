import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          MINERVA
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          AI-Powered PM Productivity Platform
        </p>
        <p className="text-lg mb-12 max-w-2xl">
          Predict customer satisfaction crashes 15-30 minutes before they become visible.
          MINERVA Sentinel detects outages before customers complain publicly.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Register
          </Link>
        </div>
      </div>
    </main>
  )
}
