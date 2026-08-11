create index tasks_project_id_idx on public.tasks (project_id) where project_id is not null;

-- A política explícita mantém o endpoint REST fechado para clientes.
-- O service_role do webhook ignora RLS e continua sendo o único escritor.
create policy "stripe_events_deny_clients" on public.stripe_webhook_events
  for all to anon, authenticated
  using (false)
  with check (false);
