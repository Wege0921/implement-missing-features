'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Download, Share } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [showIOSModal, setShowIOSModal] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if dismissed recently
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedAt = new Date(dismissed).getTime()
      const sevenDays = 7 * 24 * 60 * 60 * 1000
      if (Date.now() - dismissedAt < sevenDays) return
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // Check iOS
    const ua = navigator.userAgent
    const isiOS = /iPhone|iPad|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream
    setIsIOS(isiOS)

    if (isiOS) {
      // Show iOS banner on second visit
      const visits = parseInt(localStorage.getItem('pwa-visit-count') || '0')
      localStorage.setItem('pwa-visit-count', String(visits + 1))
      if (visits >= 1) setShowBanner(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSModal(true)
      return
    }
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowBanner(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString())
  }

  if (!showBanner) return null

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-primary text-primary-foreground border-t shadow-lg animate-in slide-in-from-bottom-5">
        <div className="container flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Download className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium truncate">
              Install Kingdom Platform for offline access
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button size="sm" variant="secondary" onClick={handleInstall}>
              Install
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss} className="text-primary-foreground hover:text-primary-foreground/80">
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </div>
        </div>
      </div>

      {/* iOS instruction modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-4" onClick={() => setShowIOSModal(false)}>
          <div className="w-full max-w-sm bg-card text-card-foreground rounded-t-2xl p-6 space-y-4 animate-in slide-in-from-bottom-10" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Install on iPhone/iPad</h3>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-bold text-foreground">1.</span>
                <span>Tap the <Share className="inline h-4 w-4 text-primary" /> Share button in Safari</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-foreground">2.</span>
                <span>Scroll down and tap &quot;Add to Home Screen&quot;</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-foreground">3.</span>
                <span>Tap &quot;Add&quot; to confirm</span>
              </li>
            </ol>
            <Button className="w-full" onClick={() => setShowIOSModal(false)}>Got it</Button>
          </div>
        </div>
      )}
    </>
  )
}
