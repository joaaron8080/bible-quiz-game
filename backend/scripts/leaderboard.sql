create table if not exists public.leaderboard (
  id uuid primary key default gen_random_uuid(),
  nickname text not null unique,
  score integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.leaderboard enable row level security;

drop policy if exists "leaderboard read for all" on public.leaderboard;
create policy "leaderboard read for all"
  on public.leaderboard for select using (true);

drop policy if exists "leaderboard insert for all" on public.leaderboard;
create policy "leaderboard insert for all"
  on public.leaderboard for insert with check (true);

drop policy if exists "leaderboard update for all" on public.leaderboard;
create policy "leaderboard update for all"
  on public.leaderboard for update using (true) with check (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'leaderboard'
  ) then
    alter publication supabase_realtime add table public.leaderboard;
  end if;
end $$;
