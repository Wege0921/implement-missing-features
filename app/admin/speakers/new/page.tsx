import { SpeakerForm } from '@/components/admin/speaker-form'
import { T } from '@/components/ui/localized-text'

export default function NewSpeakerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold"><T k="admin.newSpeaker" /></h1>
        <p className="text-muted-foreground"><T k="admin.addMinistrySpeaker" /></p>
      </div>
      <SpeakerForm />
    </div>
  )
}
