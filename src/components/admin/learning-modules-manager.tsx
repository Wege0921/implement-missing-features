'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { learningModuleSchema, type LearningModuleFormValues } from '@/lib/validations'
import type { LearningModule } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Trash2, ExternalLink } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

export function LearningModulesManager({
  pathId,
  modules: initial,
}: {
  pathId: string
  modules: LearningModule[]
}) {
  const [modules, setModules] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation()

  const form = useForm<LearningModuleFormValues>({
    resolver: zodResolver(learningModuleSchema),
    defaultValues: {
      learning_path_id: pathId,
      title_en: '',
      title_am: '',
      content_en: '',
      content_am: '',
      video_url: '',
      sort_order: modules.length,
      estimated_duration_minutes: undefined,
    },
  })

  const onAddModule = async (values: LearningModuleFormValues) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('learning_modules')
      .insert({
        learning_path_id: pathId,
        title_en: values.title_en,
        title_am: values.title_am || null,
        content_en: values.content_en || null,
        content_am: values.content_am || null,
        video_url: values.video_url || null,
        sort_order: values.sort_order,
        estimated_duration_minutes: values.estimated_duration_minutes ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single()

    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' })
      return
    }

    if (data) {
      setModules([...modules, data])
      form.reset({
        learning_path_id: pathId,
        title_en: '',
        title_am: '',
        content_en: '',
        content_am: '',
        video_url: '',
        sort_order: modules.length + 1,
      })
      setShowForm(false)
      toast({ title: t('admin.moduleAdded') })
      router.refresh()
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    const { error } = await createClient().from('learning_modules').delete().eq('id', deleteId)
    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' })
    } else {
      setModules(modules.filter((m) => m.id !== deleteId))
      toast({ title: t('admin.moduleDeleted') })
      router.refresh()
    }
    setDeleting(false)
    setDeleteId(null)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t('admin.modules')}</CardTitle>
          <CardDescription>{t('admin.orderedLessons')}</CardDescription>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('admin.addModule')}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {showForm && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onAddModule)} className="space-y-4 rounded-lg border p-4">
              <FormField
                control={form.control}
                name="title_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.titleEnglish')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="title_am"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.titleAmharic')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.contentEnglish')}</FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="video_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.videoUrl')}</FormLabel>
                    <FormControl>
                      <Input placeholder="https://youtube.com/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sort_order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin.order')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          value={field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="estimated_duration_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin.minutes')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === '' ? undefined : Number(e.target.value),
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" size="sm">
                {t('admin.saveModule')}
              </Button>
            </form>
          </Form>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>{t('common.title')}</TableHead>
                <TableHead className="w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {modules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                    {t('admin.noModulesYet')}
                  </TableCell>
                </TableRow>
              ) : (
                modules.map((mod) => (
                  <TableRow key={mod.id}>
                    <TableCell>{mod.sort_order}</TableCell>
                    <TableCell className="font-medium">{mod.title_en}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/learn/${pathId}/modules/${mod.id}`} target="_blank">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(mod.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.deleteModule')}</AlertDialogTitle>
            <AlertDialogDescription>{t('admin.deleteModuleConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
