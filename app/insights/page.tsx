import { createClient } from '@/lib/supabase/server'
import { AppNav } from '../components/app-nav'

export const dynamic = 'force-dynamic'

export default async function InsightsPage() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return null
  const { data: tasks } = await supabase.from('tasks').select('done,done_at,category,estimate_minutes,scheduled_for').order('created_at', { ascending: false })
  const list = tasks ?? []; const completed = list.filter((task) => task.done); const planned = list.filter((task) => task.scheduled_for)
  const totalMinutes = completed.reduce((sum, task) => sum + (task.estimate_minutes ?? 0), 0)
  const byCategory = Object.entries(completed.reduce<Record<string, number>>((acc, task) => { const key = task.category ?? 'Sem categoria'; acc[key] = (acc[key] ?? 0) + 1; return acc }, {}))
  return <main className="app-shell"><section className="dashboard secondary-page"><header className="topbar"><a className="brand" href="/painel"><span className="brand-mark">F</span><span>foco</span></a><a className="account-link" href="/ajustes">Minha conta</a></header><AppNav active="/insights" /><section className="secondary-hero"><p className="eyebrow">Seu ritmo</p><h1>Pequenos avanços também contam.</h1><p>Veja sinais de consistência sem transformar a sua rotina em uma cobrança.</p></section><section className="insight-grid"><article><span>Tarefas concluídas</span><strong>{completed.length}</strong><p>Desde que você começou.</p></article><article><span>Tempo estimado concluído</span><strong>{totalMinutes ? `${Math.round(totalMinutes / 60)}h` : '—'}</strong><p>Baseado nas estimativas que você adicionou.</p></article><article><span>Planejadas</span><strong>{planned.length}</strong><p>Com um lugar reservado no seu calendário.</p></article></section><section className="category-insight"><div><p className="eyebrow">Distribuição</p><h2>Onde sua energia foi usada</h2></div><div>{byCategory.length ? byCategory.map(([category, count]) => <article key={category}><span>{category}</span><div><i style={{ width: `${Math.round((count / completed.length) * 100)}%` }} /></div><strong>{count}</strong></article>) : <p className="day-empty">Conclua algumas tarefas para ver seus primeiros padrões.</p>}</div></section></section></main>
}
