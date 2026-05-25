import { createClient } from '@/lib/supabase/server'
import { SocialPostForm } from '@/components/admin/social-post-form'
import { T } from '@/components/ui/localized-text'

export default async function NewSocialPostPage({
  searchParams,
}: {
  searchParams: Promise<{ sermon?: string }>
}) {
  const { sermon: sermonId } = await searchParams
  const supabase = await createClient()
  const { data: sermons } = await supabase
    .from('sermons')
    .select('id, title_en')
    .order('title_en')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold"><T k="admin.newPost" /></h1>
        <p className="text-muted-foreground"><T k="admin.createPost" /></p>
      </div>
      <SocialPostForm sermons={sermons ?? []} defaultSermonId={sermonId} />
    </div>
  )
}
