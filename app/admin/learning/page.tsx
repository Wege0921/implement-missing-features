import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { LearningPathsTable } from '@/components/admin/learning-paths-table'
import { Plus } from 'lucide-react'
import { T } from '@/components/ui/localized-text'

export default async function AdminLearningPage() {
  const supabase = await createClient()
  const { data: paths } = await supabase
    .from('learning_paths')
    .select('*')
    .order('sort_order', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold"><T k="admin.learningPaths" /></h1>
          <p className="text-muted-foreground"><T k="admin.structuredCourses" /></p>
        </div>
        <Button asChild>
          <Link href="/admin/learning/new">
            <Plus className="mr-2 h-4 w-4" />
            <T k="admin.newPath" />
          </Link>
        </Button>
      </div>
      <LearningPathsTable paths={paths ?? []} />
    </div>
  )
}
