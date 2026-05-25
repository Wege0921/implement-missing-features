import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login?next=/admin')
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (!profile) {
    redirect('/')
  }

  const isStaff = profile.role === 'ADMIN' || profile.role === 'LEADER'
  if (!isStaff) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar profile={profile} />
      <div className="lg:pl-64">
        <AdminHeader user={user} profile={profile} />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
