'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Play, Calendar, User } from 'lucide-react'
import type { Sermon } from '@/lib/types'
import { format } from 'date-fns'
import { useTranslation } from '@/lib/i18n'
import { compressThumbnailUrl } from '@/lib/youtube'

interface FeaturedSermonsProps {
  sermons: Sermon[]
}

export function FeaturedSermons({ sermons }: FeaturedSermonsProps) {
  const { t } = useTranslation()
  if (sermons.length === 0) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">{t('home.latestSermons')}</h2>
            <p className="mt-4 text-muted-foreground">
              {t('home.noSermonsYet')}
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="container px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{t('home.latestSermons')}</h2>
            <p className="mt-2 text-muted-foreground">
              {t('home.exploreRecent')}
            </p>
          </div>
          <Button variant="outline" asChild className="hidden sm:flex">
            <Link href="/sermons">
              {t('home.viewAll')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sermons.map((sermon) => (
            <SermonCard key={sermon.id} sermon={sermon} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Button variant="outline" asChild>
            <Link href="/sermons">
              {t('home.viewAllSermons')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function SermonCard({ sermon }: { sermon: Sermon }) {
  return (
    <Card className="group hover:shadow-lg transition-shadow overflow-hidden">
      <div className="aspect-video relative bg-muted">
        {sermon.video_thumbnail ? (
          <img
            src={compressThumbnailUrl(sermon.video_thumbnail) || sermon.video_thumbnail}
            alt={sermon.title_en}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/10">
            <Play className="h-12 w-12 text-primary/50" />
          </div>
        )}
        {sermon.video_url && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="h-14 w-14 rounded-full bg-white/90 flex items-center justify-center">
              <Play className="h-6 w-6 text-primary ml-1" />
            </div>
          </div>
        )}
      </div>
      <CardHeader className="pb-2">
        {sermon.series && (
          <Badge variant="secondary" className="w-fit mb-2">
            {sermon.series.title_en}
          </Badge>
        )}
        <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
          <Link href={`/sermons/${sermon.id}`}>
            {sermon.title_en}
          </Link>
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {sermon.summary_en}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {sermon.speaker && (
            <div className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              <span>{sermon.speaker.name}</span>
            </div>
          )}
          {sermon.published_at && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{format(new Date(sermon.published_at), 'MMM d, yyyy')}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
