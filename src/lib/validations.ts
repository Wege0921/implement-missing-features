// Validation schemas using Zod for form validation
import { z } from 'zod'

export const scriptureReferenceSchema = z.object({
  book: z.string().min(1, 'Book is required'),
  chapter: z.number().min(1, 'Chapter must be at least 1'),
  verses: z.string().optional(),
})

const optionalUuid = z.preprocess(
  (val) => (val === '' || val === undefined ? null : val),
  z.string().uuid().nullable(),
)

export const sermonSchema = z.object({
  title_en: z.string().min(1, 'English title is required').max(200),
  title_am: z.string().max(200).optional(),
  summary_en: z.string().max(50000).optional(),
  summary_am: z.string().max(50000).optional(),
  scripture_references: z.array(scriptureReferenceSchema).default([]),
  speaker_id: optionalUuid,
  series_id: optionalUuid,
  video_url: z.string().url().optional().or(z.literal('')),
  audio_url: z.string().url().optional().or(z.literal('')),
  pdf_url: z.string().url().optional().or(z.literal('')),
  memory_verse_en: z.string().max(500).optional(),
  memory_verse_am: z.string().max(500).optional(),
  prayer_points: z.array(z.string()).default([]),
  discussion_questions: z.array(z.string()).default([]),
  topic_ids: z.array(z.string().uuid()).default([]),
  is_published: z.boolean().default(false),
  scheduled_at: z.string().optional(),
})

export const speakerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  bio_en: z.string().max(2000).optional(),
  bio_am: z.string().max(2000).optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
  is_active: z.boolean().default(true),
})

export const seriesSchema = z.object({
  title_en: z.string().min(1, 'English title is required').max(200),
  title_am: z.string().max(200).optional(),
  description_en: z.string().max(2000).optional(),
  description_am: z.string().max(2000).optional(),
  cover_image: z.string().url().optional().or(z.literal('')),
  is_active: z.boolean().default(true),
})

export const topicSchema = z.object({
  name_en: z.string().min(1, 'English name is required').max(100),
  name_am: z.string().max(100).optional(),
})

export const socialPostSchema = z.object({
  sermon_id: z.string().uuid(),
  platform: z.enum(['facebook', 'instagram', 'twitter', 'telegram', 'tiktok']),
  caption_en: z.string().max(2200).optional(),
  caption_am: z.string().max(2200).optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  status: z.enum(['draft', 'scheduled', 'published', 'failed']).default('draft'),
  scheduled_for: z.string().optional(),
})

export const learningPathSchema = z.object({
  title_en: z.string().min(1, 'English title is required').max(200),
  title_am: z.string().max(200).optional(),
  description_en: z.string().max(2000).optional(),
  description_am: z.string().max(2000).optional(),
  cover_image: z.string().url().optional().or(z.literal('')),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  estimated_duration_minutes: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : Number(v)),
    z.number().min(1).optional(),
  ),
  sort_order: z.coerce.number().min(0).default(0),
  is_published: z.boolean().default(false),
})

export const learningModuleSchema = z.object({
  learning_path_id: z.string().uuid(),
  title_en: z.string().min(1, 'English title is required').max(200),
  title_am: z.string().max(200).optional(),
  content_en: z.string().max(50000).optional(),
  content_am: z.string().max(50000).optional(),
  video_url: z.string().url().optional().or(z.literal('')),
  sort_order: z.coerce.number().min(0).default(0),
  estimated_duration_minutes: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : Number(v)),
    z.number().min(1).optional(),
  ),
})

export const quizOptionSchema = z.object({
  text_en: z.string().min(1),
  text_am: z.string().optional(),
})

export const quizSchema = z.object({
  module_id: z.string().uuid(),
  question_en: z.string().min(1, 'English question is required').max(1000),
  question_am: z.string().max(1000).optional(),
  options: z.array(quizOptionSchema).min(2, 'At least 2 options required').max(6),
  correct_answer_index: z.number().min(0),
  explanation_en: z.string().max(1000).optional(),
  explanation_am: z.string().max(1000).optional(),
})

export const commentSchema = z.object({
  sermon_id: z.string().uuid(),
  content: z.string().min(1, 'Comment cannot be empty').max(2000),
  parent_id: z.string().uuid().optional().nullable(),
})

export const profileSchema = z.object({
  full_name: z.string().min(1, 'Name is required').max(100),
  language_preference: z.enum(['en', 'am']).default('en'),
})

// Type inference helpers
export type SermonFormValues = z.infer<typeof sermonSchema>
export type SpeakerFormValues = z.infer<typeof speakerSchema>
export type SeriesFormValues = z.infer<typeof seriesSchema>
export type TopicFormValues = z.infer<typeof topicSchema>
export type SocialPostFormValues = z.infer<typeof socialPostSchema>
export type LearningPathFormValues = z.infer<typeof learningPathSchema>
export type LearningModuleFormValues = z.infer<typeof learningModuleSchema>
export type QuizFormValues = z.infer<typeof quizSchema>
export type CommentFormValues = z.infer<typeof commentSchema>
export type ProfileFormValues = z.infer<typeof profileSchema>
