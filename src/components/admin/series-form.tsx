'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { seriesSchema, type SeriesFormValues } from '@/lib/validations'
import type { Series } from '@/lib/types'
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
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from '@/lib/i18n'

export function SeriesForm({ series }: { series?: Series }) {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const { t } = useTranslation()

  const form = useForm<SeriesFormValues>({
    resolver: zodResolver(seriesSchema),
    defaultValues: {
      title_en: series?.title_en ?? '',
      title_am: series?.title_am ?? '',
      description_en: series?.description_en ?? '',
      description_am: series?.description_am ?? '',
      cover_image: series?.cover_image ?? '',
      is_active: series?.is_active ?? true,
    },
  })

  const onSubmit = async (values: SeriesFormValues) => {
    setSaving(true)
    const supabase = createClient()
    const payload = {
      title_en: values.title_en,
      title_am: values.title_am || null,
      description_en: values.description_en || null,
      description_am: values.description_am || null,
      cover_image: values.cover_image || null,
      is_active: values.is_active,
      updated_at: new Date().toISOString(),
    }

    try {
      if (series) {
        const { error } = await supabase.from('series').update(payload).eq('id', series.id)
        if (error) throw error
        toast({ title: t('admin.seriesUpdated') })
      } else {
        const { data, error } = await supabase
          .from('series')
          .insert({ ...payload, created_at: new Date().toISOString() })
          .select('id')
          .single()
        if (error) throw error
        toast({ title: t('admin.seriesCreated') })
        router.push(`/admin/series/${data?.id}`)
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.seriesSettings')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="cover_image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.coverImageUrl')}</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <FormLabel>{t('admin.active')}</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Tabs defaultValue="en">
          <TabsList>
            <TabsTrigger value="en">{t('admin.english')}</TabsTrigger>
            <TabsTrigger value="am">{t('admin.amharic')}</TabsTrigger>
          </TabsList>
          <TabsContent value="en" className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="title_en"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.title')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description_en"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.description')}</FormLabel>
                  <FormControl>
                    <Textarea rows={5} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          <TabsContent value="am" className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="title_am"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.title')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description_am"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.description')}</FormLabel>
                  <FormControl>
                    <Textarea rows={5} {...field} />
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
            {t('admin.saveSeries')}
          </Button>
        </div>
      </form>
    </Form>
  )
}
