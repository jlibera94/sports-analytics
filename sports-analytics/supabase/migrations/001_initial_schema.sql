-- EdgeJournal MVP Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users are handled by Supabase Auth; we reference auth.users
-- This table stores additional user profile if needed
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz default now()
);

-- Notebooks (journals per sport/tournament)
create table if not exists public.notebooks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sport text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Predictions
create table if not exists public.predictions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  notebook_id uuid references public.notebooks(id) on delete set null,
  prompt text not null,
  sport text,
  bet_type text,
  models_used jsonb default '[]',
  result_json jsonb not null,
  created_at timestamptz default now()
);

-- Trending events (for dashboard)
create table if not exists public.trending_events (
  id uuid primary key default uuid_generate_v4(),
  sport text not null,
  event_name text not null,
  start_time timestamptz,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_predictions_user_id on public.predictions(user_id);
create index if not exists idx_predictions_notebook_id on public.predictions(notebook_id);
create index if not exists idx_predictions_created_at on public.predictions(created_at);
create index if not exists idx_notebooks_user_id on public.notebooks(user_id);
create index if not exists idx_trending_events_sport on public.trending_events(sport);

-- RLS policies
alter table public.profiles enable row level security;
alter table public.notebooks enable row level security;
alter table public.predictions enable row level security;
alter table public.trending_events enable row level security;

-- Profiles: users can read/update own
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Notebooks: users can CRUD own
create policy "Users can view own notebooks" on public.notebooks
  for select using (auth.uid() = user_id);
create policy "Users can insert own notebooks" on public.notebooks
  for insert with check (auth.uid() = user_id);
create policy "Users can update own notebooks" on public.notebooks
  for update using (auth.uid() = user_id);
create policy "Users can delete own notebooks" on public.notebooks
  for delete using (auth.uid() = user_id);

-- Predictions: users can CRUD own (guests don't save)
create policy "Users can view own predictions" on public.predictions
  for select using (auth.uid() = user_id);
create policy "Users can insert predictions" on public.predictions
  for insert with check (auth.uid() = user_id);
create policy "Users can update own predictions" on public.predictions
  for update using (auth.uid() = user_id);
create policy "Users can delete own predictions" on public.predictions
  for delete using (auth.uid() = user_id);

-- Trending events: public read
create policy "Anyone can view trending events" on public.trending_events
  for select using (true);
