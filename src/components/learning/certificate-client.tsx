'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CertificateModal } from '@/components/learning/certificate-modal'

interface CertificateClientProps {
  pathTitle: string
  userName: string | null
  completionDate: string
  isComplete: boolean
}

export function CertificateClient({ pathTitle, userName, completionDate, isComplete }: CertificateClientProps) {
  const [showCertificate, setShowCertificate] = useState(false)

  if (!isComplete) return null

  return (
    <>
      <Button onClick={() => setShowCertificate(true)} className="gap-2">
        <span className="text-2xl">🎉</span>
        View Certificate
      </Button>
      <CertificateModal
        open={showCertificate}
        onOpenChange={setShowCertificate}
        pathTitle={pathTitle}
        userName={userName || 'Learner'}
        completionDate={completionDate}
      />
    </>
  )
}
