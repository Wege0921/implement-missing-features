'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { speakerSchema, type SpeakerFormValues } from '@/lib/validations'
import type { Speaker } from '@/lib/types'
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

export function SpeakerForm({ speaker }: { speaker?: Speaker }) {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const { t } = useTranslation()

  const form = useForm<SpeakerFormValues>({
    resolver: zodResolver(speakerSchema),
    defaultValues: {
      name: speaker?.name ?? '',
      bio_en: speaker?.bio_en ?? '',
      bio_am: speaker?.bio_am ?? '',
      avatar_url: speaker?.avatar_url ?? '',
      is_active: speaker?.is_active ?? true,
    },
  })

  const onSubmit = async (values: SpeakerFormValues) => {
    setSaving(true)
    const supabase = createClient()
    const payload = {
      name: values.name,
      bio_en: values.bio_en || null,
      bio_am: values.bio_am || null,
      avatar_url: values.avatar_url || null,
      is_active: values.is_active,
      updated_at: new Date().toISOString(),
    }

    try {
      if (speaker) {
        const { error } = await supabase.from('speakers').update(payload).eq('id', speaker.id)
        if (error) throw error
        toast({ title: t('admin.speakerUpdated') })
      } else {
        const { data, error } = await supabase
          .from('speakers')
          .insert({ ...payload, created_at: new Date().toISOString() })
          .select('id')
          .single()
        if (error) throw error
        toast({ title: t('admin.speakerCreated') })
        router.push(`/admin/speakers/${data?.id}`)
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
            <CardTitle>{t('admin.speakerDetails')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.name')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="avatar_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.avatarUrl')}</FormLabel>
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
            <TabsTrigger value="en">{t('admin.englishBio')}</TabsTrigger>
            <TabsTrigger value="am">{t('admin.amharicBio')}</TabsTrigger>
          </TabsList>
          <TabsContent value="en" className="mt-4">
            <FormField
              control={form.control}
              name="bio_en"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea rows={6} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          <TabsContent value="am" className="mt-4">
            <FormField
              control={form.control}
              name="bio_am"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea rows={6} {...field} />
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
            {t('admin.saveSpeaker')}
          </Button>
        </div>
      </form>
    </Form>
  )
}
