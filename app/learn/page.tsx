import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PublicShell } from '@/components/layout/public-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, BarChart } from 'lucide-react'
import type { LearningPath } from '@/lib/types'
import { T } from '@/components/ui/localized-text'

export const metadata = {
  title: 'Learning Paths',
  description: 'Structured Kingdom family journeys with modules and quizzes.',
}

export default async function LearnPage() {
  const supabase = await createClient()

  const { data: paths, error } = await supabase
    .from('learning_paths')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const progressByPath: Record<string, { completed: number; total: number }> = {}

  if (user && paths?.length) {
    for (const path of paths) {
      const { data: modules } = await supabase
        .from('learning_modules')
        .select('id')
        .eq('learning_path_id', path.id)
        .order('sort_order', { ascending: true })

      const moduleIds = modules?.map((m) => m.id) ?? []
      if (moduleIds.length === 0) {
        progressByPath[path.id] = { completed: 0, total: 0 }
        continue
      }

      const { count } = await supabase
        .from('user_module_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .in('module_id', moduleIds)

      progressByPath[path.id] = {
        completed: count ?? 0,
        total: moduleIds.length,
      }
    }
  }

  return (
    <PublicShell>
      <div className="container px-4 py-10 space-y-8">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-3xl font-bold tracking-tight"><T k="learn.title" /></h1>
          <p className="text-muted-foreground">
            <T k="learn.description" />
          </p>
        </div>

        {error && (
          <p className="text-sm text-destructive"><T k="learn.couldNotLoad" /></p>
        )}

        {!error && (!paths || paths.length === 0) && (
          <p className="text-muted-foreground"><T k="learn.willAppear" /></p>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(paths as LearningPath[])?.map((path) => {
            const prog = progressByPath[path.id]
            const pct =
              prog && prog.total > 0 ? Math.round((prog.completed / prog.total) * 100) : 0

            return (
              <Card key={path.id} className="hover:shadow-md transition-shadow">
                {path.cover_image && (
                  <div className="aspect-[2/1] overflow-hidden rounded-t-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={path.cover_image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  </div>
                )}
                <CardHeader>
                  <div className="flex gap-2 mb-2">
                    <Badge className="capitalize">{path.difficulty_level}</Badge>
                  </div>
                  <CardTitle>
                    <Link href={`/learn/${path.id}`} className="hover:text-primary transition-colors">
                      {path.title_en}
                    </Link>
                  </CardTitle>
                  <CardDescription className="line-clamp-3">{path.description_en}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    {path.estimated_duration_minutes && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {Math.round(path.estimated_duration_minutes / 60)}h
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <BarChart className="h-3.5 w-3.5" />
                      {path.difficulty_level}
                    </span>
                  </div>
                  {user && prog && prog.total > 0 && (
                    <div className="space-y-1">
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {prog.completed} / {prog.total} <T k="learn.modulesComplete" />
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </PublicShell>
  )
}
