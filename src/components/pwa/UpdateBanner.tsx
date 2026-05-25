'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, X } from 'lucide-react'

export function UpdateBanner() {
  const [showUpdate, setShowUpdate] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const handleUpdate = async () => {
      const reg = await navigator.serviceWorker.ready
      setRegistration(reg)

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (!newWorker) return

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setShowUpdate(true)
          }
        })
      })
    }

    handleUpdate()
  }, [])

  const handleUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
    window.location.reload()
  }

  if (!showUpdate) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-3 bg-blue-600 text-white border-b shadow-lg animate-in slide-in-from-top-5">
      <div className="container flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <RefreshCw className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm font-medium">A new version is available</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button size="sm" variant="secondary" onClick={handleUpdate}>
            Update now
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowUpdate(false)} className="text-white hover:text-white/80">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
