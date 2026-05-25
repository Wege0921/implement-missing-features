// Database types for Kingdom Family & Sermon Platform

export type UserRole = 'ADMIN' | 'LEADER' | 'MEMBER'
export type Language = 'en' | 'am'
export type SermonStatus = 'draft' | 'published'
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed'
export type SocialPlatform = 'facebook' | 'instagram' | 'twitter' | 'telegram' | 'tiktok'
export type SocialPostStatus = 'draft' | 'scheduled' | 'published' | 'failed'
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'
export type JobType = 'social_post' | 'notification' | 'email'
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  language_preference: Language
  created_at: string
  updated_at: string
}

export interface Speaker {
  id: string
  name: string
  bio_en: string | null
  bio_am: string | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Series {
  id: string
  title_en: string
  title_am: string | null
  description_en: string | null
  description_am: string | null
  cover_image: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Topic {
  id: string
  name_en: string
  name_am: string | null
  created_at: string
}

export interface ScriptureReference {
  book: string
  chapter: number
  verses?: string
}

export interface Sermon {
  id: string
  title_en: string
  title_am: string | null
  summary_en: string | null
  summary_am: string | null
  scripture_references: ScriptureReference[]
  speaker_id: string | null
  series_id: string | null
  video_url: string | null
  video_thumbnail: string | null
  audio_url: string | null
  pdf_url: string | null
  memory_verse_en: string | null
  memory_verse_am: string | null
  prayer_points: string[]
  discussion_questions: string[]
  is_published: boolean
  published_at: string | null
  scheduled_at: string | null
  view_count: number
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined relations
  speaker?: Speaker | null
  series?: Series | null
  topics?: Topic[]
}

export interface SermonTopic {
  sermon_id: string
  topic_id: string
}

export interface Bookmark {
  id: string
  user_id: string
  sermon_id: string
  created_at: string
  sermon?: Sermon
}

export interface ReadingProgress {
  id: string
  user_id: string
  sermon_id: string
  status: ProgressStatus
  progress_percent: number
  last_read_at: string
  sermon?: Sermon
}

export interface Comment {
  id: string
  user_id: string
  sermon_id: string
  content: string
  parent_id: string | null
  is_deleted: boolean
  created_at: string
  updated_at: string
  // Joined relations
  profile?: Profile
  replies?: Comment[]
}

export interface SocialPost {
  id: string
  sermon_id: string
  platform: SocialPlatform
  caption_en: string | null
  caption_am: string | null
  image_url: string | null
  status: SocialPostStatus
  scheduled_for: string | null
  published_at: string | null
  external_post_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  sermon?: Sermon
}

export interface ScheduledJob {
  id: string
  job_type: JobType
  payload: Record<string, unknown>
  scheduled_for: string
  status: JobStatus
  attempts: number
  last_error: string | null
  created_at: string
  updated_at: string
}

export interface LearningPath {
  id: string
  title_en: string
  title_am: string | null
  description_en: string | null
  description_am: string | null
  cover_image: string | null
  difficulty_level: DifficultyLevel
  estimated_duration_minutes: number | null
  is_published: boolean
  sort_order: number
  created_by: string | null
  created_at: string
  updated_at: string
  modules?: LearningModule[]
}

export interface LearningModule {
  id: string
  learning_path_id: string
  title_en: string
  title_am: string | null
  content_en: string | null
  content_am: string | null
  video_url: string | null
  sort_order: number
  estimated_duration_minutes: number | null
  created_at: string
  updated_at: string
  quizzes?: Quiz[]
  user_progress?: UserModuleProgress
}

export interface Quiz {
  id: string
  module_id: string
  question_en: string
  question_am: string | null
  options_en: string[]
  options_am: string[] | null
  correct_index: number
  explanation_en: string | null
  explanation_am: string | null
  sort_order: number
  created_at: string
}

export interface UserModuleProgress {
  id: string
  user_id: string
  module_id: string
  status: ProgressStatus
  quiz_score: number | null
  quiz_attempts: number
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface PushSubscription {
  id: string
  user_id: string | null
  endpoint: string
  p256dh: string
  auth: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CommunityPost {
  id: string
  user_id: string
  content: string
  sermon_id: string | null
  created_at: string
  profile?: Profile
}

// API response types
export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

// Form types
export interface SermonFormData {
  title_en: string
  title_am?: string
  summary_en?: string
  summary_am?: string
  scripture_references: ScriptureReference[]
  speaker_id?: string
  series_id?: string
  video_url?: string
  audio_url?: string
  memory_verse_en?: string
  memory_verse_am?: string
  prayer_points: string[]
  discussion_questions: string[]
  topic_ids: string[]
}

export interface SocialPostFormData {
  platform: SocialPlatform
  caption_en?: string
  caption_am?: string
  scheduled_for?: string
}
