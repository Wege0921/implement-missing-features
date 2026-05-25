import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PublicShell } from '@/components/layout/public-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, Lock, Clock, ChevronRight, Play, ArrowLeft } from 'lucide-react'
import type { LearningModule } from '@/lib/types'
import { CertificateClient } from '@/components/learning/certificate-client'
import { T } from '@/components/ui/localized-text'

interface PageProps {
  params: Promise<{ pathId: string }>
}

export default async function LearningPathDetailPage({ params }: PageProps) {
  const { pathId } = await params
  const supabase = await createClient()

  const { data: path } = await supabase
    .from('learning_paths')
    .select('*')
    .eq('id', pathId)
    .eq('is_published', true)
    .single()

  if (!path) notFound()

  const { data: modules } = await supabase
    .from('learning_modules')
    .select('*')
    .eq('learning_path_id', pathId)
    .order('sort_order', { ascending: true })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const completedIds = new Set<string>()
  if (user && modules?.length) {
    const { data: progress } = await supabase
      .from('user_module_progress')
      .select('module_id, status')
      .eq('user_id', user.id)
      .in(
        'module_id',
        modules.map((m) => m.id),
      )

    progress?.forEach((p) => {
      if (p.status === 'completed') completedIds.add(p.module_id)
    })
  }

  const sorted = (modules as LearningModule[]) ?? []
  let firstIncomplete: string | null = null

  const moduleStates = sorted.map((mod, index) => {
    const done = completedIds.has(mod.id)
    const prevDone = index === 0 || completedIds.has(sorted[index - 1].id)
    const locked = !user ? index > 0 : !prevDone && index > 0 && !done
    if (!done && !locked && !firstIncomplete) firstIncomplete = mod.id
    return { mod, done, locked: user ? locked : index > 0 && !done }
  })

  const completedCount = completedIds.size
  const totalCount = sorted.length
  const isComplete = completedCount === totalCount && totalCount > 0

  return (
    <PublicShell>
      <div className="container px-4 py-10 space-y-8">
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/learn">
              <ArrowLeft className="mr-2 h-4 w-4" />
              All paths
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">Home</Link>
          </Button>
        </div>

        {/* Hero Section */}
        {path.cover_image && (
          <div className="relative aspect-[21/9] overflow-hidden rounded-xl">
            <img src={path.cover_image} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          </div>
        )}

        <div className="max-w-4xl space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="capitalize">{path.difficulty_level}</Badge>
            {path.estimated_duration_minutes && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {Math.round(path.estimated_duration_minutes / 60)}h
              </span>
            )}
          </div>

          <h1 className="text-4xl font-bold tracking-tight">{path.title_en}</h1>
          <p className="text-xl text-muted-foreground">{path.description_en}</p>

          {user && (
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-2">
                  <span><T k="learn.progress" /></span>
                  <span>{totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
              {isComplete && (
                <CertificateClient
                  pathTitle={path.title_en}
                  userName={user.user_metadata?.full_name || user.email}
                  completionDate={new Date().toISOString()}
                  isComplete={isComplete}
                />
              )}
              {!isComplete && firstIncomplete && (
                <Button asChild className="gap-2">
                  <Link href={`/learn/${pathId}/modules/${firstIncomplete}`}>
                    <Play className="h-4 w-4" />
                    <T k="learn.continueLearning" />
                  </Link>
                </Button>
              )}
            </div>
          )}

          {!user && (
            <Button asChild>
              <Link href="/auth/login"><T k="learn.signInToTrack" /></Link>
            </Button>
          )}
        </div>

        {/* Module Timeline */}
        <div className="max-w-4xl">
          <h2 className="text-2xl font-bold mb-6"><T k="learn.modules" /></h2>
          <div className="space-y-4">
            {moduleStates.map(({ mod, done, locked }, index) => (
              <Card key={mod.id} className={locked ? 'opacity-60' : ''}>
                <CardHeader className="flex flex-row items-start gap-4 pb-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-muted font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl flex items-center gap-2">
                      {mod.title_en}
                      {done && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                      {locked && <Lock className="h-4 w-4 text-muted-foreground" />}
                      {!done && !locked && <Circle className="h-4 w-4 text-muted-foreground" />}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {(mod.content_en ?? '').replace(/<[^>]+>/g, '').slice(0, 120)}
                    </CardDescription>
                  </div>
                  {!locked && (
                    <Button asChild variant="ghost" size="icon">
                      <Link href={`/learn/${pathId}/modules/${mod.id}`}>
                        <ChevronRight className="h-5 w-5" />
                      </Link>
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {locked ? (
                    <p className="text-sm text-muted-foreground"><T k="learn.completePrevious" /></p>
                  ) : (
                    <Button variant="secondary" size="sm" asChild>
                      <Link href={`/learn/${pathId}/modules/${mod.id}`}>
                        {done ? <T k="learn.reviewModule" /> : <T k="learn.startModule" />}
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </PublicShell>
  )
}
