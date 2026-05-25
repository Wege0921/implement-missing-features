import { createClient } from '@/lib/supabase/server'
import { SermonForm } from '@/components/admin/sermon-form'
import { T } from '@/components/ui/localized-text'

export default async function NewSermonPage() {
  const supabase = await createClient()
  
  const [
    { data: speakers },
    { data: series },
    { data: topics },
  ] = await Promise.all([
    supabase.from('speakers').select('*').eq('is_active', true).order('name'),
    supabase.from('series').select('*').eq('is_active', true).order('title_en'),
    supabase.from('topics').select('*').order('name_en'),
  ])
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold"><T k="admin.createNewSermon" /></h1>
        <p className="text-muted-foreground"><T k="admin.addNewSermon" /></p>
      </div>

      <SermonForm 
        speakers={speakers || []} 
        series={series || []} 
        topics={topics || []} 
      />
    </div>
  )
}
