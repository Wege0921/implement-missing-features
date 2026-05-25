import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { TopicForm } from '@/components/admin/topic-form'
import { T } from '@/components/ui/localized-text'

export default async function EditTopicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: topic } = await supabase.from('topics').select('*').eq('id', id).single()

  if (!topic) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold"><T k="admin.editTopic" /></h1>
        <p className="text-muted-foreground">{topic.name_en}</p>
      </div>
      <TopicForm topic={topic} />
    </div>
  )
}
