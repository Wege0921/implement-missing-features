import { LearningPathForm } from '@/components/admin/learning-path-form'
import { T } from '@/components/ui/localized-text'

export default function NewLearningPathPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold"><T k="admin.newPath" /></h1>
        <p className="text-muted-foreground"><T k="admin.createCourse" /></p>
      </div>
      <LearningPathForm />
    </div>
  )
}
