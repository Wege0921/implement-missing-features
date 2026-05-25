import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, User, Database } from 'lucide-react'
import { T } from '@/components/ui/localized-text'

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
    : { data: null }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold"><T k="admin.settings" /></h1>
        <p className="text-muted-foreground"><T k="admin.platformConfig" /></p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <T k="admin.yourAccount" />
          </CardTitle>
          <CardDescription>{user?.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            <span className="text-muted-foreground"><T k="common.name" />:</span> {profile?.full_name ?? '—'}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground"><T k="admin.role" />:</span> {profile?.role ?? '—'}
          </p>
          <Button variant="outline" asChild>
            <Link href="/my/settings"><T k="admin.editProfile" /></Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <T k="admin.dataIntegrations" />
          </CardTitle>
          <CardDescription><T k="admin.managedViaEnv" /></CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p><T k="admin.envDescription" /></p>
          <p><T k="admin.seeEnvExample" /></p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <T k="admin.site" />
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            <T k="admin.publicUrl" />:{' '}
            <span className="font-mono text-foreground">
              {process.env.NEXT_PUBLIC_APP_URL ?? <T k="admin.notSet" />}
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
