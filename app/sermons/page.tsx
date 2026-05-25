import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PublicShell } from '@/components/layout/public-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, X } from 'lucide-react'
import type { Sermon, Speaker, Series, Topic } from '@/lib/types'
import { LanguageToggle } from '@/components/ui/language-toggle'
import { T } from '@/components/ui/localized-text'
import { InfiniteScrollSermons } from '@/components/sermon/infinite-scroll-sermons'
import { SermonFilters } from '@/components/sermon/sermon-filters'

export const metadata = {
  title: 'Sermons',
  description: 'Browse published sermons, series, and teachings.',
}

export default async function SermonsLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    speaker?: string
    series?: string
    topic?: string
    sort?: 'newest' | 'oldest' | 'title'
  }>
}) {
  const { q, speaker, series, topic, sort = 'newest' } = await searchParams
  const supabase = await createClient()

  // Fetch filter options
  const [
    { data: speakers },
    { data: seriesList },
    { data: topics },
  ] = await Promise.all([
    supabase.from('speakers').select('id, name').eq('is_active', true).order('name'),
    supabase.from('series').select('id, title_en').eq('is_active', true).order('title_en'),
    supabase.from('topics').select('id, name_en').order('name_en'),
  ])

  let query = supabase
    .from('sermons')
    .select(
      `
      *,
      speaker:speakers(id, name, avatar_url),
      series:series(id, title_en, title_am)
    `,
    )
    .eq('is_published', true)

  // Apply filters
  if (speaker) {
    query = query.eq('speaker_id', speaker)
  }
  if (series) {
    query = query.eq('series_id', series)
  }

  // Handle topic filter - need to fetch sermon IDs first
  let topicSermonIds: string[] = []
  if (topic) {
    const { data: sermonTopics } = await supabase
      .from('sermon_topics')
      .select('sermon_id')
      .eq('topic_id', topic)
    topicSermonIds = sermonTopics?.map((st) => st.sermon_id) ?? []
  }

  if (topicSermonIds.length > 0) {
    query = query.in('id', topicSermonIds)
  } else if (topic) {
    // If topic filter is set but no sermons match, return empty
    query = query.eq('id', 'none')
  }

  // Limit to initial page for infinite scroll
  query = query.range(0, 11)

  // Apply search
  const term = q?.trim()
  if (term) {
    query = query.or(`title_en.ilike.%${term}%,title_am.ilike.%${term}%,summary_en.ilike.%${term}%`)
  }

  // Apply sorting
  if (sort === 'newest') {
    query = query.order('published_at', { ascending: false })
  } else if (sort === 'oldest') {
    query = query.order('published_at', { ascending: true })
  } else if (sort === 'title') {
    query = query.order('title_en', { ascending: true })
  }

  const { data: sermons, error } = await query

  const hasActiveFilters = q || speaker || series || topic || sort !== 'newest'

  const buildUrl = (params: Record<string, string | null>) => {
    const url = new URLSearchParams()
    if (q) url.set('q', q)
    if (speaker) url.set('speaker', speaker)
    if (series) url.set('series', series)
    if (topic) url.set('topic', topic)
    if (sort && sort !== 'newest') url.set('sort', sort)

    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        url.delete(key)
      } else {
        url.set(key, value)
      }
    })

    const queryString = url.toString()
    return queryString ? `/sermons?${queryString}` : '/sermons'
  }

  return (
    <PublicShell>
      <div className="container px-4 py-10 space-y-8">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-3xl font-bold tracking-tight"><T k="sermons.title" /></h1>
          <p className="text-muted-foreground">
            <T k="sermons.description" />
          </p>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <form className="flex flex-col gap-3 sm:flex-row sm:max-w-lg" action="/sermons" method="get">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input name="q" defaultValue={term ?? ''} placeholder="Search sermons…" className="pl-9" />
              </div>
              <Button type="submit" variant="secondary">
                <T k="sermons.search" />
              </Button>
            </form>
            <LanguageToggle />
          </div>

          <div>
            <SermonFilters
              speakers={speakers ?? []}
              seriesList={seriesList ?? []}
              topics={topics ?? []}
              currentSpeaker={speaker}
              currentSeries={series}
              currentTopic={topic}
              currentSort={sort}
            />
          </div>

          {/* Active filters display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {q && (
                <Badge variant="secondary" className="gap-1">
                  <T k="sermons.search" />: {q}
                  <Link href={buildUrl({ q: null })} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </Link>
                </Badge>
              )}
              {speaker && (
                <Badge variant="secondary" className="gap-1">
                  <T k="sermons.speaker" />: {(speakers as Speaker[])?.find((s) => s.id === speaker)?.name}
                  <Link href={buildUrl({ speaker: null })} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </Link>
                </Badge>
              )}
              {series && (
                <Badge variant="secondary" className="gap-1">
                  <T k="sermons.series" />: {(seriesList as Series[])?.find((s) => s.id === series)?.title_en}
                  <Link href={buildUrl({ series: null })} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </Link>
                </Badge>
              )}
              {topic && (
                <Badge variant="secondary" className="gap-1">
                  <T k="sermons.topic" />: {(topics as Topic[])?.find((t) => t.id === topic)?.name_en}
                  <Link href={buildUrl({ topic: null })} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </Link>
                </Badge>
              )}
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive">
            <T k="common.error" />. Check Supabase tables and RLS policies.
          </p>
        )}

        {!error && (!sermons || sermons.length === 0) && (
          <p className="text-muted-foreground">
            {hasActiveFilters ? <T k="sermons.noResults" /> : <T k="sermons.noPublished" />}
          </p>
        )}

        <InfiniteScrollSermons
          initialSermons={(sermons as Sermon[]) ?? []}
          initialFilters={{ q, speaker, series, topic, sort }}
        />
      </div>
    </PublicShell>
  )
}
