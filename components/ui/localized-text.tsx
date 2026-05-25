'use client'

import { useTranslation, type TranslationKey } from '@/lib/i18n'

export function T({ k }: { k: TranslationKey }) {
  const { t } = useTranslation()
  return <>{t(k)}</>
}
