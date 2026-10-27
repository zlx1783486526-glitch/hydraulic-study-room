-- Run once in the Supabase project's SQL editor. The site's public key is safe
-- to use in a browser because these policies restrict every row to its owner.
create table if not exists public.study_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  state jsonb not null default '{}'::jsonb,
  client_updated_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id),
  constraint question_id_length check (length(question_id) between 1 and 80),
  constraint progress_is_object check (jsonb_typeof(state) = 'object'),
  constraint progress_size check (octet_length(state::text) <= 8192)
);

alter table public.study_progress enable row level security;
revoke all on table public.study_progress from anon, authenticated;
grant select, insert, update on table public.study_progress to authenticated;

drop policy if exists "Read own study progress" on public.study_progress;
create policy "Read own study progress"
  on public.study_progress for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Create own study progress" on public.study_progress;
create policy "Create own study progress"
  on public.study_progress for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Update own study progress" on public.study_progress;
create policy "Update own study progress"
  on public.study_progress for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create schema if not exists private;
create or replace function private.reject_older_progress()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.client_updated_at < old.client_updated_at then
    return old;
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reject_older_progress on public.study_progress;
create trigger reject_older_progress
  before update on public.study_progress
  for each row execute function private.reject_older_progress();
