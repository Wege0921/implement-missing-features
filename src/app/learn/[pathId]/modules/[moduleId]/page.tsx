import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PublicShell } from '@/components/layout/public-shell'
import { VideoPlayer } from '@/components/sermon/video-player'
import { ModuleQuiz } from '@/components/learning/module-quiz'
import { MarkCompleteButton } from '@/components/learning/mark-complete-button'
import { SafeHTML } from '@/components/ui/safe-html'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react'
import type { LearningModule, Quiz } from '@/lib/types'

interface PageProps {
  params: Promise<{ pathId: string; moduleId: string }>
}

export default async function LearningModulePage({ params }: PageProps) {
  const { pathId, moduleId } = await params
  const supabase = await createClient()

  const { data: path } = await supabase
    .from('learning_paths')
    .select('id, title_en')
    .eq('id', pathId)
    .eq('is_published', true)
    .single()

  const { data: module } = await supabase
    .from('learning_modules')
    .select('*')
    .eq('id', moduleId)
    .eq('learning_path_id', pathId)
    .single()

  if (!path || !module) notFound()

  const { data: allModules } = await supabase
    .from('learning_modules')
    .select('id, title_en, sort_order')
    .eq('learning_path_id', pathId)
    .order('sort_order', { ascending: true })

  const sorted = allModules ?? []
  const idx = sorted.findIndex((m) => m.id === moduleId)
  const prevId = idx > 0 ? sorted[idx - 1].id : null
  const nextId = idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1].id : null

  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('*')
    .eq('module_id', moduleId)
    .order('sort_order', { ascending: true })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let alreadyCompleted = false
  if (user) {
    const { data: prog } = await supabase
      .from('user_module_progress')
      .select('status')
      .eq('user_id', user.id)
      .eq('module_id', moduleId)
      .maybeSingle()
    alreadyCompleted = prog?.status === 'completed'
  }

  const mod = module as LearningModule
  const content = mod.content_en ?? ''
  const hasQuiz = (quizzes as Quiz[])?.length > 0

  return (
    <PublicShell>
      <div className="container max-w-3xl px-4 py-10 space-y-8">
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/learn/${pathId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to path
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">Home</Link>
          </Button>
        </div>

        <nav className="text-sm text-muted-foreground flex flex-wrap gap-1">
          <Link href="/learn" className="hover:text-primary">
            Learn
          </Link>
          <span>/</span>
          <Link href={`/learn/${pathId}`} className="hover:text-primary">
            {path.title_en}
          </Link>
          <span>/</span>
          <span className="text-foreground">{mod.title_en}</span>
        </nav>

        <h1 className="text-3xl font-bold">{mod.title_en}</h1>

        {mod.video_url && <VideoPlayer videoUrl={mod.video_url} title={mod.title_en} />}

        <section className="prose prose-neutral dark:prose-invert max-w-none">
          {content.includes('<') ? <SafeHTML html={content} /> : <p className="whitespace-pre-wrap text-muted-foreground">{content || 'Content coming soon.'}</p>}
        </section>

        {hasQuiz ? (
          <ModuleQuiz
            moduleId={moduleId}
            pathId={pathId}
            quizzes={quizzes as Quiz[]}
            nextModuleId={nextId}
          />
        ) : user ? (
          <div className="flex justify-center pt-2">
            <MarkCompleteButton
              moduleId={moduleId}
              pathId={pathId}
              nextModuleId={nextId}
              alreadyCompleted={alreadyCompleted}
            />
          </div>
        ) : null}

        <div className="flex justify-between pt-4 border-t">
          {prevId ? (
            <Button variant="outline" asChild>
              <Link href={`/learn/${pathId}/modules/${prevId}`}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Link>
            </Button>
          ) : (
            <span />
          )}
          {nextId ? (
            <Button variant="outline" asChild>
              <Link href={`/learn/${pathId}/modules/${nextId}`}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href={`/learn/${pathId}`}>Finish path overview</Link>
            </Button>
          )}
        </div>
      </div>
    </PublicShell>
  )
}
