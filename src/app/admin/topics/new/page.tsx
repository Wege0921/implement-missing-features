import { TopicForm } from '@/components/admin/topic-form'
import { T } from '@/components/ui/localized-text'

export default function NewTopicPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold"><T k="admin.newTopic" /></h1>
        <p className="text-muted-foreground"><T k="admin.addSermonTopic" /></p>
      </div>
      <TopicForm />
    </div>
  )
}
