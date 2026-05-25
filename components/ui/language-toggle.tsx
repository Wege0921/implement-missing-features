'use client'

import { Button } from './button'
import { Globe } from 'lucide-react'
import { useAppStore } from '@/lib/store'

export function LanguageToggle() {
  const { language, setLanguage } = useAppStore()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}
      className="flex items-center gap-1"
    >
      <Globe className="h-4 w-4" />
      <span className="text-xs">{language === 'en' ? 'EN' : 'አማ'}</span>
    </Button>
  )
}
