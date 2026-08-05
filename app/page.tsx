import { createClient } from '@/lib/supabase/server'
import { Painel } from './painel'

export default async function HomePage() {
  const supabase = createClient()

  // auth.getUser() já validado pelo middleware — aqui só buscamos os dados.
  // Graças ao RLS, esta query só pode retornar linhas do próprio usuário,
  // mesmo que o filtro .eq('user_id', ...) fosse esquecido por engano.
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null // middleware já redireciona antes disso acontecer

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
