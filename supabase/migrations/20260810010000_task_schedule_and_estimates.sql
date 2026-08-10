alter table public.tasks
  add column if not exists scheduled_for date,
  add column if not exists estimate_minutes smallint
    check (estimate_minutes is null or estimate_minutes between 5 and 480);

create index if not exists tasks_user_scheduled_idx
  on public.tasks (user_id, scheduled_for)
  where done = false;
