'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { socialPostSchema, type SocialPostFormValues } from '@/lib/validations'
import type { SocialPost, Sermon } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from '@/lib/i18n'

const PLATFORMS = ['facebook', 'instagram', 'twitter', 'telegram', 'tiktok'] as const
const STATUSES = ['draft', 'scheduled', 'published', 'failed'] as const

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function SocialPostForm({
  post,
  sermons,
  defaultSermonId,
}: {
  post?: SocialPost
  sermons: Pick<Sermon, 'id' | 'title_en'>[]
  defaultSermonId?: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const { t } = useTranslation()

  const form = useForm<SocialPostFormValues>({
    resolver: zodResolver(socialPostSchema),
    defaultValues: {
      sermon_id: post?.sermon_id ?? defaultSermonId ?? '',
      platform: post?.platform ?? 'telegram',
      caption_en: post?.caption_en ?? '',
      caption_am: post?.caption_am ?? '',
      image_url: post?.image_url ?? '',
      status: post?.status ?? 'draft',
      scheduled_for: toDatetimeLocal(post?.scheduled_for),
    },
  })

  const onSubmit = async (values: SocialPostFormValues) => {
    setSaving(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const scheduled_for = values.scheduled_for
      ? new Date(values.scheduled_for).toISOString()
      : null

    const payload = {
      sermon_id: values.sermon_id,
      platform: values.platform,
      caption_en: values.caption_en || null,
      caption_am: values.caption_am || null,
      image_url: values.image_url || null,
      status: values.status,
      scheduled_for,
      updated_at: new Date().toISOString(),
    }

    try {
      if (post) {
        const { error } = await supabase.from('social_posts').update(payload).eq('id', post.id)
        if (error) throw error
        toast({ title: t('admin.postUpdated') })
      } else {
        const { data, error } = await supabase
          .from('social_posts')
          .insert({
            ...payload,
            created_by: user?.id ?? null,
            created_at: new Date().toISOString(),
          })
          .select('id')
          .single()
        if (error) throw error
        toast({ title: t('admin.postCreated') })
        router.push(`/admin/social/${data?.id}`)
      }
      router.refresh()
    } catch (e: unknown) {
      toast({
        title: t('common.error'),
        description: e instanceof Error ? e.message : t('common.saveFailed'),
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateCaption = async () => {
    const sermonId = form.getValues('sermon_id')
    const platform = form.getValues('platform')

    if (!sermonId) {
      toast({
        title: t('admin.selectSermonFirst'),
        description: t('admin.selectBeforeGenerate'),
        variant: 'destructive',
      })
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/ai/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sermonId, platform }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || t('admin.generationFailed'))
      }

      if (data.captions) {
        if (data.captions.caption_en) {
          form.setValue('caption_en', data.captions.caption_en)
        }
        if (data.captions.caption_am) {
          form.setValue('caption_am', data.captions.caption_am)
        }
        toast({ title: t('admin.captionsGenerated'), description: t('admin.aiCaptionsApplied') })
      }
    } catch (error) {
      toast({
        title: t('admin.generationFailed'),
        description: error instanceof Error ? error.message : t('admin.generationFailed'),
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.postSettings')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="sermon_id"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>{t('admin.sermon')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('admin.selectSermon')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sermons.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.title_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="platform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.platform')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PLATFORMS.map((p) => (
                        <SelectItem key={p} value={p} className="capitalize">
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.status')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="scheduled_for"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>{t('admin.scheduledFor')}</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>{t('admin.imageUrl')}</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Tabs defaultValue="en">
          <div className="flex items-center justify-between mb-2">
            <TabsList>
              <TabsTrigger value="en">Caption (EN)</TabsTrigger>
              <TabsTrigger value="am">Caption (AM)</TabsTrigger>
            </TabsList>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerateCaption}
              disabled={generating || !form.getValues('sermon_id')}
            >
              {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {t('admin.generateWithAI')}
            </Button>
          </div>
          <TabsContent value="en" className="mt-4">
            <FormField
              control={form.control}
              name="caption_en"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea rows={8} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          <TabsContent value="am" className="mt-4">
            <FormField
              control={form.control}
              name="caption_am"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea rows={8} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t('admin.savePost')}
          </Button>
        </div>
      </form>
    </Form>
  )
}
