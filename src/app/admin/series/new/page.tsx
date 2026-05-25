import { SeriesForm } from '@/components/admin/series-form'
import { T } from '@/components/ui/localized-text'

export default function NewSeriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold"><T k="admin.newSeries" /></h1>
        <p className="text-muted-foreground"><T k="admin.createSermonSeries" /></p>
      </div>
      <SeriesForm />
    </div>
  )
}
