'use client'

import { WifiOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function OfflinePage() {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center gap-6 p-6 text-center">
      <WifiOff className="h-16 w-16 text-muted-foreground" />
      <div className="space-y-2 max-w-md">
        <h1 className="text-2xl font-bold">You&apos;re offline</h1>
        <p className="text-muted-foreground">
          Check your connection. Previously visited sermon pages may still be available from your
          browser cache.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button type="button" onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  )
}
