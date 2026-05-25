import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { SeriesForm } from '@/components/admin/series-form'
import { T } from '@/components/ui/localized-text'

export default async function EditSeriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: series } = await supabase.from('series').select('*').eq('id', id).single()

  if (!series) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold"><T k="admin.editSeries" /></h1>
        <p className="text-muted-foreground">{series.title_en}</p>
      </div>
      <SeriesForm series={series} />
    </div>
  )
}
