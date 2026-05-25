import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PublicShell } from '@/components/layout/public-shell'
import { VideoPlayer } from '@/components/sermon/video-player'
import { BookmarkToggle } from '@/components/sermon/bookmark-toggle'
import { SermonComments } from '@/components/sermon/comments'
import { ReadingProgressTracker } from '@/components/sermon/reading-progress-tracker'
import { ShareButtons } from '@/components/sermon/share-buttons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { Sermon, ScriptureReference } from '@/lib/types'
import { format } from 'date-fns'
import { BookOpen, Calendar, Download, ExternalLink } from 'lucide-react'
import { SafeHTML } from '@/components/ui/safe-html'
import { T } from '@/components/ui/localized-text'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: sermon } = await supabase
    .from('sermons')
    .select('title_en, summary_en, video_thumbnail, is_published')
    .eq('id', id)
    .single()

  if (!sermon?.is_published) {
    return { title: 'Sermon' }
  }

  const plain = (sermon.summary_en ?? '')
    .replace(/<[^>]+>/g, '')
    .slice(0, 160)

  return {
    title: sermon.title_en,
    description: plain || 'Sermon summary and resources.',
    openGraph: sermon.video_thumbnail
      ? { images: [{ url: sermon.video_thumbnail }] }
      : undefined,
  }
}

function ScriptureList({ refs }: { refs: ScriptureReference[] }) {
  if (!refs.length) return null
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <BookOpen className="h-5 w-5" />
        <T k="sermons.scriptureReferences" />
      </h2>
      <div className="grid gap-3">
        {refs.map((r, i) => (
          <blockquote
            key={`${r.book}-${r.chapter}-${i}`}
            className="border-l-4 border-primary pl-4 py-2 bg-muted/40 rounded-r-md text-sm"
          >
            <p className="font-medium text-primary">
              {r.book} {r.chapter}
              {r.verses ? `:${r.verses}` : ''}
            </p>
          </blockquote>
        ))}
      </div>
    </section>
  )
}

export default async function SermonDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: sermon } = await supabase
    .from('sermons')
    .select(
      `
      *,
      speaker:speakers(id, name, avatar_url),
      series:series(id, title_en),
      sermon_topics(topic:topics(id, name_en))
    `,
    )
    .eq('id', id)
    .eq('is_published', true)
    .single()

  if (!sermon) {
    notFound()
  }

  const s = sermon as Sermon & {
    sermon_topics?: { topic: { id: string; name_en: string } | null }[]
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let bookmarked = false
  if (user) {
    const { data: bm } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('sermon_id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    bookmarked = !!bm
  }

  let related: Sermon[] = []
  if (s.series_id) {
    const { data: rel } = await supabase
      .from('sermons')
      .select('id, title_en, published_at, video_thumbnail')
      .eq('is_published', true)
      .eq('series_id', s.series_id)
      .neq('id', id)
      .order('published_at', { ascending: false })
      .limit(3)
    related = (rel as Sermon[]) ?? []
  }

  const scriptureRefs = Array.isArray(s.scripture_references)
    ? (s.scripture_references as ScriptureReference[])
    : []
  const prayers = Array.isArray(s.prayer_points) ? (s.prayer_points as string[]) : []
  const questions = Array.isArray(s.discussion_questions) ? (s.discussion_questions as string[]) : []

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const pageUrl = appUrl ? `${appUrl.replace(/\/$/, '')}/sermons/${id}` : `/sermons/${id}`

  const summaryHtml = s.summary_en ?? ''

  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: s.title_en,
    description: s.summary_en?.replace(/<[^>]+>/g, '') || '',
    image: s.video_thumbnail,
    datePublished: s.published_at || s.created_at,
    dateModified: s.updated_at,
    author: s.speaker ? {
      '@type': 'Person',
      name: s.speaker.name,
    } : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'Kingdom Family Platform',
    },
    ...(s.series && {
      isPartOf: {
        '@type': 'Series',
        name: s.series.title_en,
      },
    }),
  }

  return (
    <PublicShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ReadingProgressTracker sermonId={id} userId={user?.id || null} />
      <article className="container max-w-4xl px-4 py-10 space-y-10">
        <div className="space-y-4">
          {s.series && (
            <Badge variant="secondary" asChild>
              <Link href={`/sermons?q=${encodeURIComponent(s.series.title_en)}`}>{s.series.title_en}</Link>
            </Badge>
          )}
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{s.title_en}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {s.speaker && <span>{s.speaker.name}</span>}
            {s.published_at && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(s.published_at), 'MMMM d, yyyy')}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <BookmarkToggle sermonId={id} initialBookmarked={bookmarked} isLoggedIn={!!user} />
            {s.pdf_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={s.pdf_url} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </a>
              </Button>
            )}
            <ShareButtons 
              url={pageUrl.startsWith('http') ? pageUrl : `https://kingdom-learning.vercel.app${pageUrl}`} 
              title={s.title_en} 
            />
          </div>
        </div>

        <VideoPlayer videoUrl={s.video_url} title={s.title_en} />

        {(s.memory_verse_en || s.memory_verse_am) && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg"><T k="sermons.memoryVerse" /></CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-lg leading-relaxed whitespace-pre-wrap">
              {s.memory_verse_en && <p>{s.memory_verse_en}</p>}
              {s.memory_verse_am && (
                <p dir="rtl" className="text-right">
                  {s.memory_verse_am}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <section className="prose prose-neutral dark:prose-invert max-w-none">
          <h2 className="text-xl font-semibold not-prose mb-4"><T k="admin.summary" /></h2>
          {summaryHtml.includes('<') ? (
            <SafeHTML html={summaryHtml} />
          ) : (
            <p className="whitespace-pre-wrap text-muted-foreground">{summaryHtml || <T k="common.noResults" />}</p>
          )}
        </section>

        <ScriptureList refs={scriptureRefs} />

        {prayers.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold"><T k="sermons.prayerPoints" /></h2>
            <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
              {prayers.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ol>
          </section>
        )}

        {questions.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold"><T k="sermons.discussionQuestions" /></h2>
            <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
              {questions.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ol>
          </section>
        )}

        {s.sermon_topics && s.sermon_topics.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {s.sermon_topics.map((st) =>
              st.topic ? (
                <Badge key={st.topic.id} variant="outline">
                  {st.topic.name_en}
                </Badge>
              ) : null,
            )}
          </div>
        )}

        {related.length > 0 && (
          <>
            <Separator />
            <section className="space-y-4">
              <h2 className="text-xl font-semibold"><T k="sermons.relatedSermons" /></h2>
              <ul className="space-y-2">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link href={`/sermons/${r.id}`} className="text-primary hover:underline inline-flex items-center gap-2">
                      {r.title_en}
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        <Separator />

        <SermonComments sermonId={id} currentUser={user ? { id: user.id, email: user.email || '' } : null} />
      </article>
    </PublicShell>
  )
}
