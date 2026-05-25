'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'
import { MessageCircle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n'

interface Post {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: {
    id: string
    full_name: string | null
    avatar_url: string | null
  } | null
}

interface Props {
  posts: Post[]
  currentUserId: string | null
}

export function CommunityFeed({ posts, currentUserId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useTranslation()

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.deleteConfirm'))) return
    await supabase.from('community_posts').delete().eq('id', id)
    router.refresh()
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return t('sermons.anonymous').charAt(0)
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-40" />
        <p>{t('community.noPosts')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {posts.map((post) => (
        <Card key={post.id}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.profiles?.avatar_url ?? undefined} />
                <AvatarFallback>{getInitials(post.profiles?.full_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">
                      {post.profiles?.full_name || t('sermons.anonymous')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {currentUserId === post.user_id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="mt-2 text-sm whitespace-pre-wrap">{post.content}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
