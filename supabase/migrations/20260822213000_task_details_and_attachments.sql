alter table public.tasks
  add column if not exists notes text,
  add column if not exists kind text not null default 'task';

alter table public.tasks
  drop constraint if exists tasks_notes_length_check,
  add constraint tasks_notes_length_check check (notes is null or char_length(notes) <= 5000),
  drop constraint if exists tasks_kind_check,
  add constraint tasks_kind_check check (kind in ('task', 'idea'));

create table public.task_subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 280),
  done boolean not null default false,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index task_subtasks_task_position_idx on public.task_subtasks (task_id, position, created_at);
create index task_subtasks_user_idx on public.task_subtasks (user_id, created_at desc);
alter table public.task_subtasks enable row level security;

create policy "task_subtasks_select_own" on public.task_subtasks for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "task_subtasks_insert_own" on public.task_subtasks for insert to authenticated
  with check (
    (select auth.uid()) = user_id and
    exists (select 1 from public.tasks t where t.id = task_id and t.user_id = (select auth.uid()))
  );
create policy "task_subtasks_update_own" on public.task_subtasks for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id and
    exists (select 1 from public.tasks t where t.id = task_id and t.user_id = (select auth.uid()))
  );
create policy "task_subtasks_delete_own" on public.task_subtasks for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.task_subtasks to authenticated;
create trigger task_subtasks_set_updated_at before update on public.task_subtasks
  for each row execute procedure public.set_updated_at();

create table public.task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null check (char_length(file_name) between 1 and 240),
  mime_type text not null,
  size_bytes bigint not null check (size_bytes between 1 and 10485760),
  created_at timestamptz not null default now()
);

create index task_attachments_task_idx on public.task_attachments (task_id, created_at desc);
create index task_attachments_user_idx on public.task_attachments (user_id, created_at desc);
alter table public.task_attachments enable row level security;

create policy "task_attachments_select_own" on public.task_attachments for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "task_attachments_insert_own" on public.task_attachments for insert to authenticated
  with check (
    (select auth.uid()) = user_id and
    exists (select 1 from public.tasks t where t.id = task_id and t.user_id = (select auth.uid()))
  );
create policy "task_attachments_delete_own" on public.task_attachments for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, delete on public.task_attachments to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'task-attachments',
  'task-attachments',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "task_files_select_own" on storage.objects for select to authenticated
  using (
    bucket_id = 'task-attachments' and
    (storage.foldername(name))[1] = (select auth.uid()::text)
  );
create policy "task_files_insert_own" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'task-attachments' and
    (storage.foldername(name))[1] = (select auth.uid()::text)
  );
create policy "task_files_delete_own" on storage.objects for delete to authenticated
  using (
    bucket_id = 'task-attachments' and
    (storage.foldername(name))[1] = (select auth.uid()::text)
  );
