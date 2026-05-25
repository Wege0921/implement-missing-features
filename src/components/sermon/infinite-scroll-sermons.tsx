'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SermonCard } from './sermon-card'
import { SermonCardSkeleton } from './sermon-card-skeleton'
import { Loader2 } from 'lucide-react'
import type { Sermon } from '@/lib/types'

interface InfiniteScrollSermonsProps {
  initialSermons: Sermon[]
  initialFilters?: {
    q?: string
    speaker?: string
    series?: string
    topic?: string
    sort?: 'newest' | 'oldest' | 'title'
  }
}

const PAGE_SIZE = 12

export function InfiniteScrollSermons({
  initialSermons,
  initialFilters = {},
}: InfiniteScrollSermonsProps) {
  const [sermons, setSermons] = useState<Sermon[]>(initialSermons)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialSermons.length >= PAGE_SIZE)
  const [page, setPage] = useState(1)
  const observerRef = useRef<HTMLDivElement>(null)

  const loadMore = async () => {
    if (loading || !hasMore) return

    setLoading(true)
    const supabase = createClient()
    const nextPage = page + 1
    const from = (nextPage - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

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
    if (initialFilters.speaker) {
      query = query.eq('speaker_id', initialFilters.speaker)
    }
    if (initialFilters.series) {
      query = query.eq('series_id', initialFilters.series)
    }
    if (initialFilters.topic) {
      const { data: sermonTopics } = await supabase
        .from('sermon_topics')
        .select('sermon_id')
        .eq('topic_id', initialFilters.topic)
      const topicSermonIds = sermonTopics?.map((st) => st.sermon_id) ?? []
      if (topicSermonIds.length > 0) {
        query = query.in('id', topicSermonIds)
      } else {
        query = query.eq('id', 'none')
      }
    }

    // Apply search
    const term = initialFilters.q?.trim()
    if (term) {
      query = query.or(`title_en.ilike.%${term}%,title_am.ilike.%${term}%,summary_en.ilike.%${term}%`)
    }

    // Apply sorting
    if (initialFilters.sort === 'newest') {
      query = query.order('published_at', { ascending: false })
    } else if (initialFilters.sort === 'oldest') {
      query = query.order('published_at', { ascending: true })
    } else if (initialFilters.sort === 'title') {
      query = query.order('title_en', { ascending: true })
    } else {
      query = query.order('published_at', { ascending: false })
    }

    query = query.range(from, to)

    const { data: newSermons, error } = await query

    if (error) {
      console.error('Failed to load more sermons:', error)
    } else {
      setSermons((prev) => [...prev, ...(newSermons as Sermon[])])
      setHasMore(newSermons.length >= PAGE_SIZE)
      setPage(nextPage)
    }

    setLoading(false)
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current)
      }
    }
  }, [page, hasMore, loading, initialFilters])

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sermons.map((sermon) => (
          <SermonCard key={sermon.id} sermon={sermon} />
        ))}
      </div>

      {hasMore && (
        <div ref={observerRef} className="flex justify-center py-8">
          {loading && (
            <div className="w-full grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <SermonCardSkeleton />
              <SermonCardSkeleton />
              <SermonCardSkeleton />
            </div>
          )}
        </div>
      )}
    </>
  )
}
