'use client'

import { useEffect, useState } from 'react'
import { sanitizeHTML } from '@/lib/sanitize'

interface SafeHTMLProps {
  html: string
  className?: string
}

export function SafeHTML({ html, className }: SafeHTMLProps) {
  const [clean, setClean] = useState<string>(() =>
    // Strip dangerous tags on the server as a baseline
    html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  )

  useEffect(() => {
    // Re-sanitize on client with DOMPurify for full protection
    setClean(sanitizeHTML(html))
  }, [html])

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}
