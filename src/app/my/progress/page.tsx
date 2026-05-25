import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PublicShell } from '@/components/layout/public-shell'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { T } from '@/components/ui/localized-text'

export const metadata = { title: 'My Progress' }

export default async function ProgressPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [{ data: reading }, { data: modules }] = await Promise.all([
    supabase
      .from('reading_progress')
      .select(
        `
        status,
        progress_percent,
        last_read_at,
        sermon:sermons(id, title_en, is_published)
      `,
      )
      .eq('user_id', user.id)
      .order('last_read_at', { ascending: false }),
    supabase
      .from('user_module_progress')
      .select(
        `
        status,
        quiz_score,
        completed_at,
        module:learning_modules(id, title_en, learning_path_id)
      `,
      )
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),
  ])

  return (
    <PublicShell>
      <div className="container px-4 py-10 space-y-10">
        <h1 className="text-3xl font-bold"><T k="nav.progress" /></h1>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold"><T k="my.sermonReading" /></h2>
          {!reading?.length && (
            <p className="text-muted-foreground text-sm"><T k="my.noSermonProgress" /></p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {reading?.map((row, i) => {
              const sermon = row.sermon as unknown as { id: string; title_en: string; is_published: boolean } | null
              if (!sermon?.is_published) return null
              return (
                <Card key={i}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      <Link href={`/sermons/${sermon.id}`}>{sermon.title_en}</Link>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {row.status.replace('_', ' ')}
                      </Badge>
                      {row.progress_percent > 0 && <span>{row.progress_percent}%</span>}
                    </CardDescription>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold"><T k="my.learningModules" /></h2>
          {!modules?.length && (
            <p className="text-muted-foreground text-sm">
              <Link href="/learn" className="text-primary underline">
                <T k="my.startLearningPath" />
              </Link>
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {modules?.map((row, i) => {
              const mod = row.module as unknown as {
                id: string
                title_en: string
                learning_path_id: string
              } | null
              if (!mod) return null
              return (
                <Card key={i}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      <Link href={`/learn/${mod.learning_path_id}/modules/${mod.id}`}>
                        {mod.title_en}
                      </Link>
                    </CardTitle>
                    <CardDescription className="flex gap-2">
                      <Badge variant="outline" className="capitalize">
                        {row.status.replace('_', ' ')}
                      </Badge>
                      {row.quiz_score != null && <span><T k="my.quiz" />: {row.quiz_score}</span>}
                    </CardDescription>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </section>
      </div>
    </PublicShell>
  )
}
