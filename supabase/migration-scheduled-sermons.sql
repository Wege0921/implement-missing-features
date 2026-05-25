alter table public.sermons
add column if not exists scheduled_at timestamptz;
