'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Calendar, Play, User } from 'lucide-react'
import type { Sermon } from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { sanitizeHTML } from '@/lib/sanitize'
import { compressThumbnailUrl } from '@/lib/youtube'

interface SermonCardProps {
  sermon: Sermon
}

export function SermonCard({ sermon }: SermonCardProps) {
  const { language } = useAppStore()

  const displayTitle = language === 'am' && sermon.title_am ? sermon.title_am : sermon.title_en
  const displaySummary = language === 'am' && sermon.summary_am ? sermon.summary_am : sermon.summary_en
  const displaySeries = language === 'am' && sermon.series?.title_am ? sermon.series.title_am : sermon.series?.title_en

  const plainSummary = displaySummary?.replace(/<[^>]+>/g, '') || ''

  return (
    <Card className="group overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-video relative bg-muted">
        {sermon.video_thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={compressThumbnailUrl(sermon.video_thumbnail) || sermon.video_thumbnail}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/10">
            <Play className="h-12 w-12 text-primary/50" />
          </div>
        )}
      </div>
      <CardHeader className="pb-2">
        {displaySeries && (
          <Badge variant="secondary" className="mb-2 w-fit">
            {displaySeries}
          </Badge>
        )}
        <CardTitle className="line-clamp-2 text-lg group-hover:text-primary transition-colors">
          <Link href={`/sermons/${sermon.id}`}>{displayTitle}</Link>
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {plainSummary}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        {sermon.speaker && (
          <span className="inline-flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            {sermon.speaker.name}
          </span>
        )}
        {sermon.published_at && (
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {format(new Date(sermon.published_at), 'MMM d, yyyy')}
          </span>
        )}
      </CardContent>
    </Card>
  )
}
