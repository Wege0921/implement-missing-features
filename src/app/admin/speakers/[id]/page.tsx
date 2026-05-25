import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { SpeakerForm } from '@/components/admin/speaker-form'
import { T } from '@/components/ui/localized-text'

export default async function EditSpeakerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: speaker } = await supabase.from('speakers').select('*').eq('id', id).single()

  if (!speaker) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold"><T k="admin.editSpeaker" /></h1>
        <p className="text-muted-foreground">{speaker.name}</p>
      </div>
      <SpeakerForm speaker={speaker} />
    </div>
  )
}
