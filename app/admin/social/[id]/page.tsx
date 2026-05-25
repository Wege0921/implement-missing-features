import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { SocialPostForm } from '@/components/admin/social-post-form'
import { T } from '@/components/ui/localized-text'

export default async function EditSocialPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: post }, { data: sermons }] = await Promise.all([
    supabase.from('social_posts').select('*').eq('id', id).single(),
    supabase.from('sermons').select('id, title_en').order('title_en'),
  ])

  if (!post) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold"><T k="admin.editPost" /></h1>
        <p className="text-muted-foreground capitalize">{post.platform}</p>
      </div>
      <SocialPostForm post={post} sermons={sermons ?? []} />
    </div>
  )
}
