import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PublicShell } from '@/components/layout/public-shell'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { T } from '@/components/ui/localized-text'

export const metadata = { title: 'My Bookmarks' }

export default async function BookmarksPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select(
      `
      id,
      created_at,
      sermon:sermons(id, title_en, published_at, video_thumbnail, is_published)
    `,
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <PublicShell>
      <div className="container px-4 py-10 space-y-6">
        <h1 className="text-3xl font-bold"><T k="nav.bookmarks" /></h1>
        {!bookmarks?.length && (
          <p className="text-muted-foreground">
            <T k="my.noBookmarks" />{' '}
            <Link href="/sermons" className="text-primary underline">
              <T k="home.browseSermons" />
            </Link>
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {bookmarks?.map((b) => {
            const sermon = b.sermon as unknown as {
              id: string
              title_en: string
              published_at: string | null
              is_published: boolean
            } | null
            if (!sermon?.is_published) return null
            return (
              <Card key={b.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    <Link href={`/sermons/${sermon.id}`} className="hover:text-primary">
                      {sermon.title_en}
                    </Link>
                  </CardTitle>
                  <CardDescription>
                    <T k="my.saved" /> {format(new Date(b.created_at), 'MMM d, yyyy')}
                  </CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      </div>
    </PublicShell>
  )
}
