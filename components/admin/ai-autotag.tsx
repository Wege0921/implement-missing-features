'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Loader2, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from '@/lib/i18n'

interface AIAutoTagProps {
  title: string
  summary: string
  onTopicsGenerated: (topics: string[]) => void
}

export function AIAutoTag({ title, summary, onTopicsGenerated }: AIAutoTagProps) {
  const [generating, setGenerating] = useState(false)
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([])
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const { toast } = useToast()
  const { t } = useTranslation()

  const handleGenerateTags = async () => {
    setGenerating(true)

    try {
      const response = await fetch('/api/ai/tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, summary }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || t('admin.generateTagsFailed'))
      }

      const data = await response.json()
      setSuggestedTopics(data.topics)
      toast({ title: t('admin.tagsGenerated') })
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('admin.generateTagsFailed'),
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    )
  }

  const handleApplyTopics = () => {
    onTopicsGenerated(selectedTopics)
    setSelectedTopics([])
    setSuggestedTopics([])
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          {t('admin.aiAutoTag')}
        </CardTitle>
        <CardDescription>
          {t('admin.aiAutoTagDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleGenerateTags}
          disabled={generating || !title}
          className="w-full"
          variant="outline"
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('common.generating')}
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              {t('admin.generateTopicSuggestions')}
            </>
          )}
        </Button>

        {suggestedTopics.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">{t('admin.selectTopics')}</p>
            <div className="flex flex-wrap gap-2">
              {suggestedTopics.map((topic) => (
                <Badge
                  key={topic}
                  variant={selectedTopics.includes(topic) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleTopic(topic)}
                >
                  {topic}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleApplyTopics} disabled={selectedTopics.length === 0} size="sm">
                {t('admin.applyTopics', { count: String(selectedTopics.length), plural: selectedTopics.length !== 1 ? 's' : '' })}
              </Button>
              <Button
                onClick={() => {
                  setSelectedTopics([])
                  setSuggestedTopics([])
                }}
                variant="ghost"
                size="sm"
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
