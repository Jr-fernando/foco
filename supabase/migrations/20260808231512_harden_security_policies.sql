alter function public.set_updated_at() set search_path = public;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.register_activity(uuid) from public, anon;
grant execute on function public.register_activity(uuid) to authenticated;

alter policy "profiles_select_own" on public.profiles
  using ((select auth.uid()) = id);

alter policy "profiles_update_own" on public.profiles
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

alter policy "tasks_select_own" on public.tasks
  using ((select auth.uid()) = user_id);

alter policy "tasks_insert_own" on public.tasks
  with check ((select auth.uid()) = user_id);

alter policy "tasks_update_own" on public.tasks
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy "tasks_delete_own" on public.tasks
  using ((select auth.uid()) = user_id);

alter policy "streaks_select_own" on public.streaks
  using ((select auth.uid()) = user_id);
