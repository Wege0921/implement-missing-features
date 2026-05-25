'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface MarkCompleteButtonProps {
  moduleId: string
  pathId: string
  nextModuleId: string | null
  alreadyCompleted: boolean
}

export function MarkCompleteButton({
  moduleId,
  pathId,
  nextModuleId,
  alreadyCompleted,
}: MarkCompleteButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(alreadyCompleted)

  const handleComplete = async () => {
    setSaving(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      toast({ title: 'Sign in required', variant: 'destructive' })
      setSaving(false)
      return
    }

    const { error } = await supabase.from('user_module_progress').upsert(
      {
        user_id: user.id,
        module_id: moduleId,
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,module_id' },
    )

    setSaving(false)
    if (error) {
      toast({ title: 'Could not save progress', description: error.message, variant: 'destructive' })
      return
    }
    setDone(true)
    toast({ title: 'Module completed' })
    router.refresh()
    if (nextModuleId) {
      router.push(`/learn/${pathId}/modules/${nextModuleId}`)
    }
  }

  if (done) {
    return (
      <Button variant="secondary" disabled className="gap-2">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        Completed
      </Button>
    )
  }

  return (
    <Button onClick={handleComplete} disabled={saving} className="gap-2">
      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
      Mark as complete
    </Button>
  )
}
