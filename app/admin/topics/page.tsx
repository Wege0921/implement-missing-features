import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { TopicsTable } from '@/components/admin/topics-table'
import { Plus } from 'lucide-react'
import { T } from '@/components/ui/localized-text'

export default async function AdminTopicsPage() {
  const supabase = await createClient()
  const { data: topics } = await supabase.from('topics').select('*').order('name_en')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold"><T k="admin.topics" /></h1>
          <p className="text-muted-foreground"><T k="admin.tagSermons" /></p>
        </div>
        <Button asChild>
          <Link href="/admin/topics/new">
            <Plus className="mr-2 h-4 w-4" />
            <T k="admin.newTopic" />
          </Link>
        </Button>
      </div>
      <TopicsTable topics={topics ?? []} />
    </div>
  )
}
