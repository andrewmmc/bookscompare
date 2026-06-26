-- BooksCompare account sync schema
-- Run against the Supabase project (SQL editor or `supabase db push`).
-- Tables mirror the local AsyncStorage shapes in
-- apps/mobile/src/lib/history.ts and apps/mobile/src/lib/favourites.ts.

-- ---------------------------------------------------------------------------
-- history_entries
-- ---------------------------------------------------------------------------
create table if not exists public.history_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  -- stable dedupe key: "isbn:<normalized>" or "title:<trimmed>"
  dedupe_key  text not null,
  type        text not null check (type in ('isbn', 'title')),
  isbn        text,
  title       text,
  viewed_at   timestamptz not null,
  updated_at  timestamptz not null default now(),
  unique (user_id, dedupe_key)
);

create index if not exists history_entries_user_viewed_idx
  on public.history_entries (user_id, viewed_at desc);

alter table public.history_entries enable row level security;

drop policy if exists "history_entries_select_own" on public.history_entries;
create policy "history_entries_select_own"
  on public.history_entries for select
  using (auth.uid() = user_id);

drop policy if exists "history_entries_insert_own" on public.history_entries;
create policy "history_entries_insert_own"
  on public.history_entries for insert
  with check (auth.uid() = user_id);

drop policy if exists "history_entries_update_own" on public.history_entries;
create policy "history_entries_update_own"
  on public.history_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "history_entries_delete_own" on public.history_entries;
create policy "history_entries_delete_own"
  on public.history_entries for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- favourites
-- ---------------------------------------------------------------------------
create table if not exists public.favourites (
  user_id   uuid not null references auth.users (id) on delete cascade,
  isbn      text not null,
  title     text not null,
  added_at  timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, isbn)
);

create index if not exists favourites_user_added_idx
  on public.favourites (user_id, added_at desc);

alter table public.favourites enable row level security;

drop policy if exists "favourites_select_own" on public.favourites;
create policy "favourites_select_own"
  on public.favourites for select
  using (auth.uid() = user_id);

drop policy if exists "favourites_insert_own" on public.favourites;
create policy "favourites_insert_own"
  on public.favourites for insert
  with check (auth.uid() = user_id);

drop policy if exists "favourites_update_own" on public.favourites;
create policy "favourites_update_own"
  on public.favourites for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "favourites_delete_own" on public.favourites;
create policy "favourites_delete_own"
  on public.favourites for delete
  using (auth.uid() = user_id);
