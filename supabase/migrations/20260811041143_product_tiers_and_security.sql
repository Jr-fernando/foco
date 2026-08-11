create table public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index routines_user_idx on public.routines (user_id, active, created_at);
alter table public.routines enable row level security;
create policy "routines_owner_all" on public.routines for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.routines to authenticated;
create trigger routines_set_updated_at before update on public.routines for each row execute procedure public.set_updated_at();

create table public.routine_checkins (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  completed_on date not null default current_date,
  created_at timestamptz not null default now(),
  unique (routine_id, completed_on)
);
create index routine_checkins_user_date_idx on public.routine_checkins (user_id, completed_on desc);
alter table public.routine_checkins enable row level security;
create policy "routine_checkins_select_own" on public.routine_checkins for select to authenticated using ((select auth.uid()) = user_id);
create policy "routine_checkins_insert_own" on public.routine_checkins for insert to authenticated with check (
  (select auth.uid()) = user_id and exists (select 1 from public.routines r where r.id = routine_id and r.user_id = (select auth.uid()))
);
create policy "routine_checkins_delete_own" on public.routine_checkins for delete to authenticated using ((select auth.uid()) = user_id);
grant select, insert, delete on public.routine_checkins to authenticated;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  description text check (description is null or char_length(description) <= 500),
  status text not null default 'active' check (status in ('active', 'paused', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_user_status_idx on public.projects (user_id, status, created_at desc);
alter table public.projects enable row level security;
create policy "projects_owner_all" on public.projects for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.projects to authenticated;
create trigger projects_set_updated_at before update on public.projects for each row execute procedure public.set_updated_at();

alter table public.tasks add column project_id uuid references public.projects(id) on delete set null;
create index tasks_user_project_idx on public.tasks (user_id, project_id) where project_id is not null;

create table public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);
alter table public.stripe_webhook_events enable row level security;
revoke all on public.stripe_webhook_events from anon, authenticated;
