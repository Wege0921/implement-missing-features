-- Migration: update quizzes table to use options_en/options_am and correct_index
-- Run this BEFORE re-running mock-data.sql

-- Add new columns
alter table public.quizzes add column if not exists options_en jsonb not null default '[]'::jsonb;
alter table public.quizzes add column if not exists options_am jsonb not null default '[]'::jsonb;
alter table public.quizzes add column if not exists correct_index integer not null default 0;

-- Drop old columns if they exist
alter table public.quizzes drop column if exists options;
alter table public.quizzes drop column if exists correct_answer_index;
