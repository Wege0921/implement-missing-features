'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { createClient } from '@/lib/supabase/client'
import { sermonSchema, type SermonFormValues } from '@/lib/validations'
import type { Sermon, Speaker, Series, Topic, ScriptureReference } from '@/lib/types'
import { getYoutubeThumbnailSmall, getYoutubeVideoId } from '@/lib/youtube'
import { parseScriptureLine } from '@/lib/scripture'
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
import { TiptapEditor } from '@/components/ui/tiptap-editor'
import { CloudinaryUpload } from '@/components/ui/cloudinary-upload'
import { AISummarizer } from '@/components/admin/ai-summarizer'
import { AIAutoTag } from '@/components/admin/ai-autotag'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { BookOpen, Calendar, Download, ExternalLink, FileText, Image, Link, Loader2, Plus, Search, Sparkles, Trash2, Upload, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from '@/lib/i18n'

const NONE = '__none__'

function normalizeScripture(value: unknown): ScriptureReference[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (r): r is ScriptureReference =>
      typeof r === 'object' &&
      r !== null &&
      'book' in r &&
      typeof (r as ScriptureReference).book === 'string' &&
      'chapter' in r &&
      typeof (r as ScriptureReference).chapter === 'number',
  )
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((x): x is string => typeof x === 'string')
}

function buildDefaults(
  sermon: Sermon | undefined,
  initialTopicIds: string[],
): SermonFormValues {
  if (!sermon) {
    return {
      title_en: '',
      title_am: '',
      summary_en: '',
      summary_am: '',
      scripture_references: [],
      speaker_id: null,
      series_id: null,
      video_url: '',
      audio_url: '',
      pdf_url: '',
      memory_verse_en: '',
      memory_verse_am: '',
      prayer_points: [],
      discussion_questions: [],
      topic_ids: initialTopicIds,
      is_published: false,
      scheduled_at: undefined,
    }
  }

  return {
    title_en: sermon.title_en,
    title_am: sermon.title_am ?? '',
    summary_en: sermon.summary_en ?? '',
    summary_am: sermon.summary_am ?? '',
    scripture_references: normalizeScripture(sermon.scripture_references),
    speaker_id: sermon.speaker_id,
    series_id: sermon.series_id,
    video_url: sermon.video_url ?? '',
    audio_url: sermon.audio_url ?? '',
    pdf_url: sermon.pdf_url ?? '',
    memory_verse_en: sermon.memory_verse_en ?? '',
    memory_verse_am: sermon.memory_verse_am ?? '',
    prayer_points: normalizeStringArray(sermon.prayer_points),
    discussion_questions: normalizeStringArray(sermon.discussion_questions),
    topic_ids: initialTopicIds.length ? initialTopicIds : [],
    is_published: sermon.is_published,
    scheduled_at: sermon.scheduled_at ? new Date(sermon.scheduled_at).toISOString().slice(0, 16) : undefined,
  }
}

export interface SermonFormProps {
  speakers: Speaker[]
  series: Series[]
  topics: Topic[]
  sermon?: Sermon
  initialTopicIds?: string[]
}

export function SermonForm({
  speakers,
  series,
  topics,
  sermon,
  initialTopicIds = [],
}: SermonFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation()
  const [scriptureInput, setScriptureInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const autoSavingRef = useRef(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showAISummarizer, setShowAISummarizer] = useState(false)
  const [showAIAutoTag, setShowAIAutoTag] = useState(false)

  const defaults = useMemo(
    () => buildDefaults(sermon, initialTopicIds),
    [sermon, initialTopicIds],
  )

  const form = useForm<SermonFormValues>({
    resolver: zodResolver(sermonSchema),
    defaultValues: defaults,
    values: defaults,
  })

  const prayerPoints = form.watch('prayer_points')
  const discussionQuestions = form.watch('discussion_questions')

  const videoUrl = form.watch('video_url')
  const youtubeId = useMemo(() => getYoutubeVideoId(videoUrl), [videoUrl])
  const thumbPreview = youtubeId ? getYoutubeThumbnailSmall(youtubeId) : null

  // Autosave every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (autoSavingRef.current) return // Skip if already autosaving
      const values = form.getValues()
      if (!values.title_en) return // Don't autosave if no title

      autoSavingRef.current = true
      setAutoSaving(true)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || !sermon) {
        autoSavingRef.current = false
        setAutoSaving(false)
        return
      }

      const yt = getYoutubeVideoId(values.video_url)
      const video_thumbnail = yt ? getYoutubeThumbnailSmall(yt) : null

      const scheduledAt = values.scheduled_at ? new Date(values.scheduled_at).toISOString() : null

      const payload = {
        title_en: values.title_en,
        title_am: values.title_am || null,
        summary_en: values.summary_en || null,
        summary_am: values.summary_am || null,
        scripture_references: values.scripture_references,
        speaker_id: values.speaker_id,
        series_id: values.series_id,
        video_url: values.video_url || null,
        video_thumbnail,
        audio_url: values.audio_url || null,
        pdf_url: values.pdf_url || null,
        memory_verse_en: values.memory_verse_en || null,
        memory_verse_am: values.memory_verse_am || null,
        prayer_points: values.prayer_points.filter((p) => p.trim().length > 0),
        discussion_questions: values.discussion_questions.filter((q) => q.trim().length > 0),
        is_published: values.is_published,
        published_at: sermon.published_at,
        updated_at: new Date().toISOString(),
        ...(scheduledAt !== null && { scheduled_at: scheduledAt }),
      }

      try {
        const { error } = await supabase.from('sermons').update(payload).eq('id', sermon.id)
        if (error) throw error
        await syncSermonTopics(supabase, sermon.id, values.topic_ids)
        setLastSaved(new Date())
      } catch (e) {
        // Silent fail on autosave
        const message = e instanceof Error ? e.message : JSON.stringify(e)
        console.error('Autosave failed:', message, e)
      } finally {
        autoSavingRef.current = false
        setAutoSaving(false)
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [form, sermon])

  const addScripture = () => {
    const parsed = parseScriptureLine(scriptureInput)
    if (!parsed) {
      toast({
        title: t('admin.parseReferenceError'),
        description: t('admin.referenceFormatHint'),
        variant: 'destructive',
      })
      return
    }
    const current = form.getValues('scripture_references')
    form.setValue('scripture_references', [...current, parsed])
    setScriptureInput('')
  }

  const removeScripture = (index: number) => {
    const next = [...form.getValues('scripture_references')]
    next.splice(index, 1)
    form.setValue('scripture_references', next)
  }

  const syncSermonTopics = async (supabase: ReturnType<typeof createClient>, sermonId: string, topicIds: string[]) => {
    const uniqueTopicIds = [...new Set(topicIds)]
    // Delete existing sermon-topic relationships
    const { error: deleteError } = await supabase.from('sermon_topics').delete().eq('sermon_id', sermonId)
    if (deleteError) throw deleteError
    // Insert new ones
    if (uniqueTopicIds.length > 0) {
      const topicRelations = uniqueTopicIds.map((topicId) => ({ sermon_id: sermonId, topic_id: topicId }))
      const { error: insertError } = await supabase.from('sermon_topics').insert(topicRelations)
      if (insertError) throw insertError
    }
  }

  const createAutoSocialPosts = async (supabase: ReturnType<typeof createClient>, sermonId: string, title: string, summary: string) => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    const sermonUrl = `${appUrl}/sermons/${sermonId}`

    // Create Telegram post
    await supabase.from('social_posts').insert({
      sermon_id: sermonId,
      platform: 'telegram',
      caption_en: summary,
      status: 'published',
      published_at: new Date().toISOString(),
    })

    // Create WhatsApp post
    await supabase.from('social_posts').insert({
      sermon_id: sermonId,
      platform: 'whatsapp',
      caption_en: summary,
      status: 'published',
      published_at: new Date().toISOString(),
    })
  }

  const onSubmit = async (values: SermonFormValues) => {
    setSaving(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast({ title: t('admin.notSignedIn'), description: t('admin.signInAgain'), variant: 'destructive' })
      setSaving(false)
      return
    }

    const yt = getYoutubeVideoId(values.video_url)
    const video_thumbnail = yt ? getYoutubeThumbnailSmall(yt) : null

    const publishedAt =
      values.is_published
        ? sermon?.published_at ?? new Date().toISOString()
        : null

    const scheduledAt = values.scheduled_at ? new Date(values.scheduled_at).toISOString() : null

    const payload = {
      title_en: values.title_en,
      title_am: values.title_am || null,
      summary_en: values.summary_en || null,
      summary_am: values.summary_am || null,
      scripture_references: values.scripture_references,
      speaker_id: values.speaker_id,
      series_id: values.series_id,
      video_url: values.video_url || null,
      video_thumbnail,
      audio_url: values.audio_url || null,
      pdf_url: values.pdf_url || null,
      memory_verse_en: values.memory_verse_en || null,
      memory_verse_am: values.memory_verse_am || null,
      prayer_points: values.prayer_points.filter((p) => p.trim().length > 0),
      discussion_questions: values.discussion_questions.filter((q) => q.trim().length > 0),
      is_published: values.is_published,
      published_at: publishedAt,
      updated_at: new Date().toISOString(),
      ...(scheduledAt !== null && { scheduled_at: scheduledAt }),
    }

    try {
      if (sermon) {
        const { error } = await supabase.from('sermons').update(payload).eq('id', sermon.id)
        if (error) throw error
        await syncSermonTopics(supabase, sermon.id, values.topic_ids)

        // Auto-post to social media if sermon is being published
        if (values.is_published && !sermon.is_published) {
          await createAutoSocialPosts(supabase, sermon.id, values.title_en, values.summary_en || '')
        }

        toast({ title: t('admin.sermonUpdated') })
      } else {
        const insertRow = {
          ...payload,
          created_by: user.id,
          view_count: 0,
          created_at: new Date().toISOString(),
        }
        const { data, error } = await supabase.from('sermons').insert(insertRow).select('id').single()
        if (error) throw error
        if (data?.id) {
          await syncSermonTopics(supabase, data.id, values.topic_ids)

          // Auto-post to social media if sermon is being published
          if (values.is_published) {
            await createAutoSocialPosts(supabase, data.id, values.title_en, values.summary_en || '')
          }
        }
        toast({ title: t('admin.sermonCreated') })
        router.push(`/admin/sermons/${data?.id}`)
        router.refresh()
        setSaving(false)
        return
      }
      router.refresh()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t('common.saveFailed')
      toast({ title: t('common.error'), description: message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const scriptureRefs = form.watch('scripture_references')

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.publishing')}</CardTitle>
            <CardDescription>{t('admin.publishedDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="is_published"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>{t('admin.published')}</FormLabel>
                    <p className="text-sm text-muted-foreground">{t('admin.publishedDescription')}</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="scheduled_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.schedulePublish')}</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      suppressHydrationWarning
                      {...field}
                    />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    {t('admin.scheduleHint')}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            {youtubeId && thumbPreview && (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbPreview} alt={t('admin.thumbnailPreviewAlt')} className="h-16 w-28 rounded object-cover border" />
                <span className="text-xs text-muted-foreground">{t('admin.thumbnailSaved')}</span>
              </div>
            )}
            {sermon && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {autoSaving ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {t('admin.autosaving')}
                  </>
                ) : lastSaved ? (
                  <>{t('admin.lastSaved')} {lastSaved.toLocaleTimeString()}</>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('admin.sharedDetails')}</CardTitle>
            <CardDescription>{t('admin.sharedDetailsDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="speaker_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.speakerLabel')}</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === NONE ? null : v)}
                    value={field.value ?? NONE}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('common.select')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>{t('common.none')}</SelectItem>
                      {speakers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
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
              name="series_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.seriesLabel')}</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === NONE ? null : v)}
                    value={field.value ?? NONE}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('common.select')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>{t('common.none')}</SelectItem>
                      {series.map((s) => (
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
              name="video_url"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>{t('admin.videoUrl')}</FormLabel>
                  <FormControl>
                    <Input placeholder="https://www.youtube.com/watch?v=..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="audio_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.audioUrl')}</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pdf_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.pdfUpload')}</FormLabel>
                  <FormControl>
                    <CloudinaryUpload
                      value={field.value || ''}
                      onChange={field.onChange}
                      accept="application/pdf"
                      maxSizeMB={10}
                      folder="sermons/pdfs"
                      label={t('admin.uploadPdf')}
                      placeholder={t('admin.noPdfSelected')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>{t('admin.topicsLabel')}</FormLabel>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setShowAIAutoTag(!showAIAutoTag)}
                >
                  <Sparkles className="mr-1 h-3 w-3" />
                  {t('admin.aiAutoTag')}
                </Button>
              </div>
              {showAIAutoTag && (
                <div className="mt-2">
                  <AIAutoTag
                    title={form.getValues('title_en')}
                    summary={form.getValues('summary_en') || ''}
                    onTopicsGenerated={(topics) => {
                      const currentTopics = form.getValues('topic_ids') || []
                      const existingTopics = topics.filter((t) => currentTopics.includes(t))
                      const newTopics = topics.filter((t) => !currentTopics.includes(t))
                      form.setValue('topic_ids', [...currentTopics, ...newTopics])
                    }}
                  />
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                {topics.map((topic) => (
                  <FormField
                    key={topic.id}
                    control={form.control}
                    name="topic_ids"
                    render={({ field }) => {
                      const checked = field.value?.includes(topic.id)
                      return (
                        <FormItem key={topic.id} className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(on) => {
                                const next = new Set(field.value ?? [])
                                if (on) next.add(topic.id)
                                else next.delete(topic.id)
                                field.onChange([...next])
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">{topic.name_en}</FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {t('sermons.scriptureReferences')}
            </CardTitle>
            <CardDescription>{t('admin.scriptureDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={scriptureInput}
                onChange={(e) => setScriptureInput(e.target.value)}
                placeholder={t('admin.scripturePlaceholder')}
                className="sm:flex-1"
              />
              <Button type="button" variant="secondary" onClick={addScripture}>
                <Plus className="mr-2 h-4 w-4" />
                {t('admin.addScripture')}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {scriptureRefs.map((ref, i) => (
                <Badge key={`${ref.book}-${ref.chapter}-${i}`} variant="secondary" className="gap-1 pr-1">
                  {ref.book} {ref.chapter}:{ref.verses ?? ''}
                  <button
                    type="button"
                    className="ml-1 rounded-full p-0.5 hover:bg-muted"
                    onClick={() => removeScripture(i)}
                    aria-label={t('sermons.removeReference')}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="en" className="w-full">
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
                  <FormLabel>{t('admin.titleLabel')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="summary_en"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>{t('admin.summary')}</FormLabel>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setShowAISummarizer(!showAISummarizer)}
                    >
                      <Sparkles className="mr-1 h-3 w-3" />
                      {t('admin.aiSummarizer')}
                    </Button>
                  </div>
                  {showAISummarizer && (
                    <div className="mt-2">
                      <AISummarizer
                        sermonId={sermon?.id}
                        videoUrl={form.getValues('video_url')}
                        onSummaryGenerated={(summary) => field.onChange(summary)}
                        language="en"
                      />
                    </div>
                  )}
                  <FormControl>
                    <TiptapEditor
                      content={field.value || ''}
                      onChange={field.onChange}
                      placeholder={t('sermons.mainTeachingSummary')}
                      minHeight="300px"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="memory_verse_en"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.memoryVerse')}</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
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
                  <FormLabel>{t('admin.titleLabel')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="summary_am"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.summary')}</FormLabel>
                  <FormControl>
                    <TiptapEditor
                      content={field.value || ''}
                      onChange={field.onChange}
                      placeholder={t('sermons.placeholderAmharic')}
                      minHeight="300px"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="memory_verse_am"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.memoryVerse')}</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>{t('admin.prayerPoints')}</CardTitle>
            <CardDescription>{t('admin.prayerPointsDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {prayerPoints.map((_, index) => (
              <FormField
                key={`prayer-${index}`}
                control={form.control}
                name={`prayer_points.${index}`}
                render={({ field: f }) => (
                  <FormItem>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input {...f} />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const next = prayerPoints.filter((_, i) => i !== index)
                          form.setValue('prayer_points', next)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => form.setValue('prayer_points', [...prayerPoints, ''])}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('admin.addPrayerPoint')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('admin.discussionQuestions')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {discussionQuestions.map((_, index) => (
              <FormField
                key={`dq-${index}`}
                control={form.control}
                name={`discussion_questions.${index}`}
                render={({ field: f }) => (
                  <FormItem>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input {...f} />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const next = discussionQuestions.filter((_, i) => i !== index)
                          form.setValue('discussion_questions', next)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => form.setValue('discussion_questions', [...discussionQuestions, ''])}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('admin.addQuestion')}
            </Button>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('common.loading')}
              </>
            ) : (
              t('admin.saveSermon')
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
