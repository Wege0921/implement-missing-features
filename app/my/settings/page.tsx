import { createClient } from '@/lib/supabase/server'
import { PublicShell } from '@/components/layout/public-shell'
import { ProfileSettingsForm } from '@/components/auth/profile-settings-form'
import type { Profile } from '@/lib/types'
import { T } from '@/components/ui/localized-text'

export const metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  return (
    <PublicShell>
      <div className="container max-w-lg px-4 py-10 space-y-6">
        <h1 className="text-3xl font-bold"><T k="nav.settings" /></h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        {profile && <ProfileSettingsForm profile={profile as Profile} />}
      </div>
    </PublicShell>
  )
}
