import { createClient } from '@/lib/supabase/server'
import { Painel } from '../painel'
import { getUserPlan, hasPlan } from '@/lib/plans'

export const dynamic = 'force-dynamic'

export default async function PainelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const plan = await getUserPlan(supabase, user.id)
  const [{ data: tasks }, { data: streak }, { data: projects }] = await Promise.all([
    supabase.from('tasks').select('*').order('created_at', { ascending: false }),
    supabase.from('streaks').select('*').eq('user_id', user.id).maybeSingle(),
    hasPlan(plan, 'pro') ? supabase.from('projects').select('id,name').eq('status', 'active').order('name') : Promise.resolve({ data: [] }),
  ])

  return (
    <Painel
      initialTasks={tasks ?? []}
      initialStreak={streak ?? { current_streak: 0, longest_streak: 0 }}
      userEmail={user.email ?? ''}
      projects={projects ?? []}
      currentPlan={plan}
    />
  )
}
