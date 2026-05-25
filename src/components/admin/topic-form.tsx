'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { topicSchema, type TopicFormValues } from '@/lib/validations'
import type { Topic } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from '@/lib/i18n'

export function TopicForm({ topic }: { topic?: Topic }) {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const { t } = useTranslation()

  const form = useForm<TopicFormValues>({
    resolver: zodResolver(topicSchema),
    defaultValues: {
      name_en: topic?.name_en ?? '',
      name_am: topic?.name_am ?? '',
    },
  })

  const onSubmit = async (values: TopicFormValues) => {
    setSaving(true)
    const supabase = createClient()
    const payload = {
      name_en: values.name_en,
      name_am: values.name_am || null,
    }

    try {
      if (topic) {
        const { error } = await supabase.from('topics').update(payload).eq('id', topic.id)
        if (error) throw error
        toast({ title: t('admin.topicUpdated') })
      } else {
        const { data, error } = await supabase
          .from('topics')
          .insert({ ...payload, created_at: new Date().toISOString() })
          .select('id')
          .single()
        if (error) throw error
        toast({ title: t('admin.topicCreated') })
        router.push(`/admin/topics/${data?.id}`)
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
        <FormField
          control={form.control}
          name="name_en"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.nameEnglish')}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name_am"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin.nameAmharic')}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t('admin.saveTopic')}
          </Button>
        </div>
      </form>
    </Form>
  )
}
