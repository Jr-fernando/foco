-- Foco — schema inicial
-- Convenção: toda tabela de dados do usuário tem RLS habilitado desde a criação.
-- Nunca existe uma janela onde a tabela fica exposta sem política.

create extension if not exists "pgcrypto";

-- ========== PROFILES ==========
-- Espelha auth.users com dados públicos/mutáveis pela aplicação.
-- Nunca colocamos dados sensíveis direto em auth.users.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text not null default 'America/Sao_Paulo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Cria o profile automaticamente quando um usuário se cadastra
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ========== TASKS ==========
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  priority text not null default 'media' check (priority in ('alta', 'media', 'baixa')),
  category text, -- ex: 'revenda-iphone', 'social-media', 'geral' — expansível sem migration
  done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_user_id_idx on public.tasks (user_id);
create index tasks_user_done_idx on public.tasks (user_id, done);
create index tasks_user_created_idx on public.tasks (user_id, created_at desc);

alter table public.tasks enable row level security;

create policy "tasks_select_own" on public.tasks
  for select using (auth.uid() = user_id);

create policy "tasks_insert_own" on public.tasks
  for insert with check (auth.uid() = user_id);

create policy "tasks_update_own" on public.tasks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "tasks_delete_own" on public.tasks
  for delete using (auth.uid() = user_id);

-- updated_at automático
create function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute procedure public.set_updated_at();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ========== STREAKS ==========
-- Um registro por usuário. O cálculo de streak fica no backend (edge function / server action),
-- nunca confiar no client para incrementar isso.
create table public.streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_active_date date,
  seen_milestones int[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.streaks enable row level security;

create policy "streaks_select_own" on public.streaks
  for select using (auth.uid() = user_id);

-- Sem policy de insert/update para o client: streaks só mudam via função
-- SECURITY DEFINER abaixo, chamada pela aplicação autenticada. Isso evita
-- que o usuário manipule o próprio streak direto pela API REST.

create function public.register_activity(p_user_id uuid)
returns public.streaks
language plpgsql
security definer set search_path = public
as $$
declare
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_row public.streaks;
  v_gap int;
begin
  if auth.uid() is null or auth.uid() != p_user_id then
    raise exception 'não autorizado';
  end if;

  select * into v_row from public.streaks where user_id = p_user_id;

  if not found then
    insert into public.streaks (user_id, current_streak, longest_streak, last_active_date)
    values (p_user_id, 1, 1, v_today)
    returning * into v_row;
    return v_row;
  end if;

  if v_row.last_active_date = v_today then
    return v_row; -- já registrado hoje, idempotente
  end if;

  v_gap := v_today - v_row.last_active_date;

  if v_gap = 1 then
    v_row.current_streak := v_row.current_streak + 1;
  else
    v_row.current_streak := 1;
  end if;

  v_row.longest_streak := greatest(v_row.longest_streak, v_row.current_streak);
  v_row.last_active_date := v_today;

  update public.streaks
    set current_streak = v_row.current_streak,
        longest_streak = v_row.longest_streak,
        last_active_date = v_row.last_active_date,
        updated_at = now()
    where user_id = p_user_id;

  return v_row;
end;
$$;

-- ========== INTEGRAÇÃO N8N (leitura via service_role) ==========
-- O n8n nunca usa a anon key. Usa a service_role key (que bypassa RLS)
-- guardada como credencial no próprio n8n, nunca no client/front.
-- View de conveniência para o workflow de automação ler tarefas pendentes
-- relacionadas à revenda, sem expor a tabela inteira.
create view public.tasks_pending_resale as
  select id, user_id, title, priority, created_at
  from public.tasks
  where done = false and category = 'revenda-iphone';
