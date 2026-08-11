import { createClient } from '@/lib/supabase/server'
import { Painel } from '../painel'

export const dynamic = 'force-dynamic'

export default async function PainelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const [{ data: tasks }, { data: streak }] = await Promise.all([
    supabase.from('tasks').select('*').order('created_at', { ascending: false }),
    supabase.from('streaks').select('*').eq('user_id', user.id).maybeSingle(),
  ])

  return (
    <Painel
      initialTasks={tasks ?? []}
      initialStreak={streak ?? { current_streak: 0, longest_streak: 0 }}
      userEmail={user.email ?? ''}
    />
  )
}
