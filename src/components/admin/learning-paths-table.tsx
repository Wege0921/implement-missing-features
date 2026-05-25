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
import { MoreHorizontal, Pencil, Trash2, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { LearningPath } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from '@/lib/i18n'

export function LearningPathsTable({ paths: initial }: { paths: LearningPath[] }) {
  const [paths, setPaths] = useState(initial)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation()

  const filtered = paths.filter((p) => p.title_en.toLowerCase().includes(search.toLowerCase()))

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    const { error } = await createClient().from('learning_paths').delete().eq('id', deleteId)
    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' })
    } else {
      setPaths(paths.filter((p) => p.id !== deleteId))
      toast({ title: t('admin.pathDeleted') })
      router.refresh()
    }
    setDeleting(false)
    setDeleteId(null)
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('admin.searchPaths')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('common.title')}</TableHead>
              <TableHead>{t('admin.difficulty')}</TableHead>
              <TableHead>{t('admin.status')}</TableHead>
              <TableHead className="w-[70px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  {t('admin.noPathsFound')}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((path) => (
                <TableRow key={path.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/learning/${path.id}`} className="hover:text-primary">
                      {path.title_en}
                    </Link>
                  </TableCell>
                  <TableCell className="capitalize">{path.difficulty_level}</TableCell>
                  <TableCell>
                    <Badge variant={path.is_published ? 'default' : 'secondary'}>
                      {path.is_published ? t('admin.published') : t('admin.draft')}
                    </Badge>
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
                          <Link href={`/admin/learning/${path.id}`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {t('common.edit')}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(path.id)}
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
            <AlertDialogTitle>{t('admin.deletePath')}</AlertDialogTitle>
            <AlertDialogDescription>{t('admin.deletePathConfirm')}</AlertDialogDescription>
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
