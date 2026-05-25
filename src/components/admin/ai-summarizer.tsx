'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from '@/lib/i18n'

interface AISummarizerProps {
  sermonId?: string
  videoUrl?: string
  onSummaryGenerated: (summary: string) => void
  language?: 'en' | 'am'
}

export function AISummarizer({
  sermonId,
  videoUrl,
  onSummaryGenerated,
  language = 'en',
}: AISummarizerProps) {
  const [transcript, setTranscript] = useState('')
  const [generating, setGenerating] = useState(false)
  const { toast } = useToast()
  const { t } = useTranslation()

  const handleGenerateSummary = async () => {
    if (!sermonId) {
      toast({
        title: t('admin.sermonRequired'),
        description: t('admin.saveSermonFirst'),
        variant: 'destructive',
      })
      return
    }

    setGenerating(true)

    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sermonId,
          transcript: transcript || undefined,
          videoUrl,
          language,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || t('admin.generateSummaryFailed'))
      }

      const data = await response.json()
      onSummaryGenerated(data.summary)
      toast({ title: t('admin.summaryGenerated') })
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('admin.generateSummaryFailed'),
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          {t('admin.aiSummarizer')}
        </CardTitle>
        <CardDescription>
          {t('admin.aiSummarizerDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder={t('admin.pasteTranscript')}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={6}
          disabled={generating}
        />
        <Button
          onClick={handleGenerateSummary}
          disabled={generating || !sermonId}
          className="w-full"
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('common.generating')}
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              {t('admin.generateSummary', { lang: language === 'en' ? t('admin.english') : t('admin.amharic') })}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
