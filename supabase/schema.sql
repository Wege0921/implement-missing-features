-- Kingdom Family Platform — run once in Supabase SQL Editor
-- Dashboard → SQL → New query → paste → Run

-- Extensions
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles (linked to auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  role text not null default 'MEMBER' check (role in ('ADMIN', 'LEADER', 'MEMBER')),
  language_preference text not null default 'en' check (language_preference in ('en', 'am')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, language_preference)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'MEMBER',
    'en'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Staff check for RLS
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('ADMIN', 'LEADER')
  );
$$;

-- ---------------------------------------------------------------------------
-- Content tables
-- ---------------------------------------------------------------------------
create table if not exists public.speakers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bio_en text,
  bio_am text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.series (
  id uuid primary key default gen_random_uuid(),
  title_en text not null,
  title_am text,
  description_en text,
  description_am text,
  cover_image text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_am text,
  created_at timestamptz not null default now()
);

create table if not exists public.sermons (
  id uuid primary key default gen_random_uuid(),
  title_en text not null,
  title_am text,
  summary_en text,
  summary_am text,
  scripture_references jsonb not null default '[]'::jsonb,
  speaker_id uuid references public.speakers (id) on delete set null,
  series_id uuid references public.series (id) on delete set null,
  video_url text,
  video_thumbnail text,
  audio_url text,
  pdf_url text,
  memory_verse_en text,
  memory_verse_am text,
  prayer_points jsonb not null default '[]'::jsonb,
  discussion_questions jsonb not null default '[]'::jsonb,
  is_published boolean not null default false,
  published_at timestamptz,
  view_count integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sermons_published_idx on public.sermons (is_published, published_at desc);

create table if not exists public.sermon_topics (
  sermon_id uuid not null references public.sermons (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  primary key (sermon_id, topic_id)
);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  sermon_id uuid not null references public.sermons (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, sermon_id)
);

create table if not exists public.reading_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  sermon_id uuid not null references public.sermons (id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  progress_percent integer not null default 0,
  last_read_at timestamptz not null default now(),
  unique (user_id, sermon_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  sermon_id uuid not null references public.sermons (id) on delete cascade,
  content text not null,
  parent_id uuid references public.comments (id) on delete cascade,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  sermon_id uuid not null references public.sermons (id) on delete cascade,
  platform text not null check (platform in ('facebook', 'instagram', 'twitter', 'telegram', 'tiktok')),
  caption_en text,
  caption_am text,
  image_url text,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published', 'failed')),
  scheduled_for timestamptz,
  published_at timestamptz,
  external_post_id text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_paths (
  id uuid primary key default gen_random_uuid(),
  title_en text not null,
  title_am text,
  description_en text,
  description_am text,
  cover_image text,
  difficulty_level text not null default 'beginner' check (difficulty_level in ('beginner', 'intermediate', 'advanced')),
  estimated_duration_minutes integer,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_modules (
  id uuid primary key default gen_random_uuid(),
  learning_path_id uuid not null references public.learning_paths (id) on delete cascade,
  title_en text not null,
  title_am text,
  content_en text,
  content_am text,
  video_url text,
  sort_order integer not null default 0,
  estimated_duration_minutes integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.learning_modules (id) on delete cascade,
  question_en text not null,
  question_am text,
  options_en jsonb not null default '[]'::jsonb,
  options_am jsonb not null default '[]'::jsonb,
  correct_index integer not null default 0,
  explanation_en text,
  explanation_am text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.user_module_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  module_id uuid not null references public.learning_modules (id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  quiz_score integer,
  quiz_attempts integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, module_id)
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.speakers enable row level security;
alter table public.series enable row level security;
alter table public.topics enable row level security;
alter table public.sermons enable row level security;
alter table public.sermon_topics enable row level security;
alter table public.bookmarks enable row level security;
alter table public.reading_progress enable row level security;
alter table public.comments enable row level security;
alter table public.social_posts enable row level security;
alter table public.learning_paths enable row level security;
alter table public.learning_modules enable row level security;
alter table public.quizzes enable row level security;
alter table public.user_module_progress enable row level security;

-- profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles_staff_select_all" on public.profiles;
create policy "profiles_staff_select_all" on public.profiles for select using (public.is_staff());

-- public read published content
drop policy if exists "sermons_public_read" on public.sermons;
create policy "sermons_public_read" on public.sermons for select using (is_published = true);
drop policy if exists "learning_paths_public_read" on public.learning_paths;
create policy "learning_paths_public_read" on public.learning_paths for select using (is_published = true);
drop policy if exists "learning_modules_public_read" on public.learning_modules;
create policy "learning_modules_public_read" on public.learning_modules for select using (
  exists (select 1 from public.learning_paths lp where lp.id = learning_path_id and lp.is_published = true)
);
drop policy if exists "speakers_public_read" on public.speakers;
create policy "speakers_public_read" on public.speakers for select using (is_active = true);
drop policy if exists "series_public_read" on public.series;
create policy "series_public_read" on public.series for select using (is_active = true);
drop policy if exists "topics_public_read" on public.topics;
create policy "topics_public_read" on public.topics for select using (true);
drop policy if exists "sermon_topics_public_read" on public.sermon_topics;
create policy "sermon_topics_public_read" on public.sermon_topics for select using (true);
drop policy if exists "quizzes_public_read" on public.quizzes;
create policy "quizzes_public_read" on public.quizzes for select using (true);

-- staff full access on content
drop policy if exists "staff_all_speakers" on public.speakers;
create policy "staff_all_speakers" on public.speakers for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff_all_series" on public.series;
create policy "staff_all_series" on public.series for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff_all_topics" on public.topics;
create policy "staff_all_topics" on public.topics for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff_all_sermons" on public.sermons;
create policy "staff_all_sermons" on public.sermons for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff_all_sermon_topics" on public.sermon_topics;
create policy "staff_all_sermon_topics" on public.sermon_topics for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff_all_social_posts" on public.social_posts;
create policy "staff_all_social_posts" on public.social_posts for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff_all_learning_paths" on public.learning_paths;
create policy "staff_all_learning_paths" on public.learning_paths for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff_all_learning_modules" on public.learning_modules;
create policy "staff_all_learning_modules" on public.learning_modules for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff_all_quizzes" on public.quizzes;
create policy "staff_all_quizzes" on public.quizzes for all using (public.is_staff()) with check (public.is_staff());

-- user-owned data
drop policy if exists "bookmarks_own" on public.bookmarks;
create policy "bookmarks_own" on public.bookmarks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "reading_progress_own" on public.reading_progress;
create policy "reading_progress_own" on public.reading_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "user_module_progress_own" on public.user_module_progress;
create policy "user_module_progress_own" on public.user_module_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "comments_read" on public.comments;
create policy "comments_read" on public.comments for select using (true);
drop policy if exists "comments_insert_own" on public.comments;
create policy "comments_insert_own" on public.comments for insert with check (auth.uid() = user_id);
drop policy if exists "comments_update_own" on public.comments;
create policy "comments_update_own" on public.comments for update using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Backfill profiles for existing auth users (run after schema)
-- ---------------------------------------------------------------------------
insert into public.profiles (id, full_name, role, language_preference)
select
  id,
  coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  'MEMBER',
  'en'
from auth.users
on conflict (id) do nothing;

-- Make YOUR account admin (change the email):
-- update public.profiles set role = 'ADMIN' where id = (select id from auth.users where email = 'you@example.com');
