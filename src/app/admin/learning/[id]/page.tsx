import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { LearningPathForm } from '@/components/admin/learning-path-form'
import { LearningModulesManager } from '@/components/admin/learning-modules-manager'
import { T } from '@/components/ui/localized-text'

export default async function EditLearningPathPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: path }, { data: modules }] = await Promise.all([
    supabase.from('learning_paths').select('*').eq('id', id).single(),
    supabase
      .from('learning_modules')
      .select('*')
      .eq('learning_path_id', id)
      .order('sort_order', { ascending: true }),
  ])

  if (!path) notFound()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold"><T k="admin.editPath" /></h1>
        <p className="text-muted-foreground">{path.title_en}</p>
      </div>
      <LearningPathForm path={path} />
      <LearningModulesManager pathId={id} modules={modules ?? []} />
    </div>
  )
}
