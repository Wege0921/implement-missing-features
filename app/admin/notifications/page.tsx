import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell } from 'lucide-react'
import { T } from '@/components/ui/localized-text'

export default function AdminNotificationsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold"><T k="admin.notifications" /></h1>
        <p className="text-muted-foreground"><T k="admin.webPush" /></p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <T k="admin.pushNotifications" />
          </CardTitle>
          <CardDescription>
            <T k="admin.pushDescription" />
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p><T k="admin.configureEnv" /></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>NEXT_PUBLIC_VAPID_PUBLIC_KEY</li>
            <li>VAPID_PRIVATE_KEY</li>
            <li>VAPID_EMAIL</li>
          </ul>
          <p className="pt-2">
            <T k="admin.membersEnable" />
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
