import { createClient } from '@/lib/supabase/server'
import { AppNav } from '../components/app-nav'
import { Planejador } from './planejador'

export const dynamic = 'force-dynamic'

export default async function PlanejarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: tasks } = await supabase.from('tasks').select('id,title,priority,scheduled_for,estimate_minutes,done').eq('done', false).order('created_at', { ascending: false })

  return <main className="app-shell"><section className="dashboard secondary-page"><header className="topbar"><a className="brand" href="/painel"><span className="brand-mark">F</span><span>foco</span></a><a className="account-link" href="/ajustes">Minha conta</a></header><AppNav active="/planejar" /><Planejador initialTasks={tasks ?? []} /></section></main>
}
