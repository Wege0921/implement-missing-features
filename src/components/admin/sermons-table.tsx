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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { Input } from '@/components/ui/input'
import { MoreHorizontal, Pencil, Trash2, Eye, Search, Share2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Sermon } from '@/lib/types'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from '@/lib/i18n'

interface SermonsTableProps {
  sermons: Sermon[]
}

export function SermonsTable({ sermons: initialSermons }: SermonsTableProps) {
  const [sermons, setSermons] = useState(initialSermons)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation()

  const filteredSermons = sermons.filter((sermon) =>
    sermon.title_en.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async () => {
    if (!deleteId) return
    
    setIsDeleting(true)
    const supabase = createClient()
    
    const { error } = await supabase
      .from('sermons')
      .delete()
      .eq('id', deleteId)
    
    if (error) {
      toast({
        title: t('common.error'),
        description: t('admin.deleteSermon'),
        variant: 'destructive',
      })
    } else {
      setSermons(sermons.filter((s) => s.id !== deleteId))
      toast({
        title: t('common.success'),
        description: t('common.delete'),
      })
    }
    
    setIsDeleting(false)
    setDeleteId(null)
  }

  const handlePublishToggle = async (sermon: Sermon) => {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('sermons')
      .update({
        is_published: !sermon.is_published,
        published_at: !sermon.is_published ? new Date().toISOString() : null,
      })
      .eq('id', sermon.id)
    
    if (error) {
      toast({
        title: t('common.error'),
        description: t('admin.editSermon'),
        variant: 'destructive',
      })
    } else {
      setSermons(
        sermons.map((s) =>
          s.id === sermon.id
            ? { ...s, is_published: !s.is_published, published_at: !s.is_published ? new Date().toISOString() : null }
            : s
        )
      )
      toast({
        title: t('common.success'),
        description: `${t('admin.sermons')} ${!sermon.is_published ? t('admin.publish') : t('admin.unpublish')}`,
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('admin.searchSermons')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.titleLabel')}</TableHead>
              <TableHead>{t('admin.speakerLabel')}</TableHead>
              <TableHead>{t('admin.seriesLabel')}</TableHead>
              <TableHead>{t('admin.status')}</TableHead>
              <TableHead>{t('admin.views')}</TableHead>
              <TableHead>{t('admin.date')}</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSermons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {t('admin.noSermonsFound')}
                </TableCell>
              </TableRow>
            ) : (
              filteredSermons.map((sermon) => (
                <TableRow key={sermon.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/admin/sermons/${sermon.id}`}
                      className="hover:text-primary transition-colors"
                    >
                      {sermon.title_en}
                    </Link>
                  </TableCell>
                  <TableCell>{sermon.speaker?.name || '-'}</TableCell>
                  <TableCell>{sermon.series?.title_en || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={sermon.is_published ? 'default' : 'secondary'}>
                      {sermon.is_published ? t('admin.published') : t('admin.draft')}
                    </Badge>
                  </TableCell>
                  <TableCell>{sermon.view_count}</TableCell>
                  <TableCell>
                    {format(new Date(sermon.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">{t('common.actions')}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/sermons/${sermon.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            {t('admin.view')}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/sermons/${sermon.id}`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {t('common.edit')}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/social/new?sermon=${sermon.id}`}>
                            <Share2 className="mr-2 h-4 w-4" />
                            {t('admin.createSocialPost')}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handlePublishToggle(sermon)}
                        >
                          {sermon.is_published ? t('admin.unpublish') : t('admin.publish')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteId(sermon.id)}
                          className="text-destructive"
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
            <AlertDialogTitle>{t('admin.deleteSermon')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.deleteSermonConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t('admin.deleting') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
