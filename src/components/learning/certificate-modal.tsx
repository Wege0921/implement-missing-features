'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Award, Download, Share2 } from 'lucide-react'
import { useState } from 'react'

interface CertificateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pathTitle: string
  userName: string
  completionDate: string
}

export function CertificateModal({ open, onOpenChange, pathTitle, userName, completionDate }: CertificateModalProps) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = () => {
    setDownloading(true)
    // Simulate download - in production this would call the certificate generation API
    setTimeout(() => {
      setDownloading(false)
    }, 1000)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Certificate of Completion - ${pathTitle}`,
          text: `I completed the "${pathTitle}" learning path on Kingdom Family!`,
          url: window.location.href,
        })
      } catch (err) {
        console.error('Share failed:', err)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Certificate of Completion
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Certificate Preview */}
          <div className="border-2 border-yellow-500/30 rounded-lg p-8 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20">
            <div className="text-center space-y-4">
              <div className="text-4xl">🏆</div>
              <h3 className="text-2xl font-bold text-yellow-700 dark:text-yellow-500">Certificate of Completion</h3>
              <p className="text-sm text-muted-foreground">This certifies that</p>
              <p className="text-xl font-semibold">{userName}</p>
              <p className="text-sm text-muted-foreground">has successfully completed</p>
              <p className="text-lg font-medium">{pathTitle}</p>
              <div className="pt-4 border-t border-yellow-500/20">
                <p className="text-sm text-muted-foreground">Completed on {new Date(completionDate).toLocaleDateString()}</p>
                <p className="text-xs text-muted-foreground mt-2">Kingdom Family Learning Platform</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center pt-4">
            <Button onClick={handleDownload} disabled={downloading} className="gap-2">
              <Download className="h-4 w-4" />
              {downloading ? 'Downloading...' : 'Download'}
            </Button>
            <Button variant="outline" onClick={handleShare} className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
