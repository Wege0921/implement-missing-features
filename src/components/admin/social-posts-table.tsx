'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MoreHorizontal, Pencil, Trash2, Search, Send, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { SocialPost } from '@/lib/types'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from '@/lib/i18n'

type SocialPostRow = SocialPost & {
  sermon?: { title_en: string } | null
}

const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'secondary',
  scheduled: 'outline',
  published: 'default',
  failed: 'destructive',
}

export function SocialPostsTable({ posts: initial }: { posts: SocialPostRow[] }) {
  const [posts, setPosts] = useState(initial)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [posting, setPosting] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation()

  const filtered = posts.filter(
    (p) =>
      p.platform.includes(search.toLowerCase()) ||
      (p.sermon?.title_en ?? '').toLowerCase().includes(search.toLowerCase()),
  )

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    const { error } = await createClient().from('social_posts').delete().eq('id', deleteId)
    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' })
    } else {
      setPosts(posts.filter((p) => p.id !== deleteId))
      toast({ title: t('admin.postDeleted') })
      router.refresh()
    }
    setDeleting(false)
    setDeleteId(null)
  }

  const handlePostToTelegram = async (post: SocialPostRow) => {
    setPosting(post.id)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    const sermonUrl = `${appUrl}/sermons/${post.sermon_id}`

    try {
      const response = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sermonId: post.sermon_id,
          sermonTitle: post.sermon?.title_en ?? '',
          sermonSummary: post.caption_en ?? '',
          sermonUrl,
        }),
      })

      if (!response.ok) throw new Error(t('admin.failedPostTelegram'))

      await createClient()
        .from('social_posts')
        .update({ status: 'published', published_at: new Date().toISOString() })
        .eq('id', post.id)

      setPosts(posts.map((p) => (p.id === post.id ? { ...p, status: 'published' as const } : p)))
      toast({ title: t('admin.postedToTelegram') })
    } catch (error) {
      toast({ title: t('common.error'), description: t('admin.failedPostTelegram'), variant: 'destructive' })
    } finally {
      setPosting(null)
    }
  }

  const handlePostToWhatsApp = async (post: SocialPostRow) => {
    setPosting(post.id)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    const sermonUrl = `${appUrl}/sermons/${post.sermon_id}`

    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
          sermonTitle: post.sermon?.title_en ?? '',
          sermonSummary: post.caption_en ?? '',
          sermonUrl,
        }),
      })

      if (!response.ok) throw new Error(t('admin.failedPostWhatsApp'))

      await createClient()
        .from('social_posts')
        .update({ status: 'published', published_at: new Date().toISOString() })
        .eq('id', post.id)

      setPosts(posts.map((p) => (p.id === post.id ? { ...p, status: 'published' as const } : p)))
      toast({ title: t('admin.postedToWhatsApp') })
    } catch (error) {
      toast({ title: t('common.error'), description: t('admin.failedPostWhatsApp'), variant: 'destructive' })
    } finally {
      setPosting(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('admin.searchPlatform')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.platform')}</TableHead>
              <TableHead>{t('admin.sermon')}</TableHead>
              <TableHead>{t('admin.status')}</TableHead>
              <TableHead>{t('common.scheduled')}</TableHead>
              <TableHead className="w-[120px]">{t('common.actions')}</TableHead>
              <TableHead className="w-[70px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {t('admin.noSocialPostsFound')}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="capitalize font-medium">{post.platform}</TableCell>
                  <TableCell>{post.sermon?.title_en ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[post.status] ?? 'secondary'} className="capitalize">
                      {post.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {post.scheduled_for
                      ? format(new Date(post.scheduled_for), 'MMM d, yyyy HH:mm')
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {post.status === 'draft' || post.status === 'scheduled' ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handlePostToTelegram(post)}
                            disabled={posting === post.id}
                            title={t('admin.postedToTelegram')}
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handlePostToWhatsApp(post)}
                            disabled={posting === post.id}
                            title={t('admin.postedToWhatsApp')}
                          >
                            <MessageCircle className="h-3 w-3" />
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/social/${post.id}`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {t('common.edit')}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(post.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.deleteSocialPost')}</AlertDialogTitle>
            <AlertDialogDescription>{t('admin.deleteSocialPostConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
