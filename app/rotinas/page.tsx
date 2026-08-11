import { createClient } from '@/lib/supabase/server'
import { getUserPlan, hasPlan } from '@/lib/plans'
import { AppNav } from '../components/app-nav'
import { PlanBadge } from '../components/plan-badge'
import { createRoutine, deleteRoutine, toggleRoutine } from '../actions/product'

export const dynamic = 'force-dynamic'

export default async function RotinasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const plan = await getUserPlan(supabase, user.id)
  const unlocked = hasPlan(plan, 'essential')
  const today = new Date().toISOString().slice(0, 10)
  const [{ data: routines }, { data: checkins }] = unlocked ? await Promise.all([
    supabase.from('routines').select('id,title').eq('active', true).order('created_at'),
    supabase.from('routine_checkins').select('routine_id').eq('completed_on', today),
  ]) : [{ data: [] }, { data: [] }]
  const done = new Set((checkins ?? []).map((item) => item.routine_id))

  return <main className="app-shell"><section className="dashboard secondary-page"><header className="topbar"><a className="brand" href="/painel"><span className="brand-mark">F</span><span>foco</span></a><a className="account-link" href="/planos">Ver planos</a></header><AppNav active="/rotinas" />
    <section className="secondary-hero product-hero"><div><p className="eyebrow">Consistência gentil</p><h1>Rotinas que cabem na vida real.</h1><p>Repita o que faz bem sem transformar constância em cobrança.</p></div><PlanBadge plan="essential" /></section>
    {!unlocked ? <section className="feature-lock"><div className="lock-visual"><span>7 dias</span><strong>Uma pequena ação por vez</strong><i style={{ width: '72%' }} /></div><div><PlanBadge plan="essential" /><h2>Crie rituais e acompanhe sua constância</h2><p>Organize hábitos, marque o dia concluído e veja sua sequência crescer com leveza.</p><a className="button button-primary" href="/planos">Desbloquear Rotinas</a></div></section> : <>
      <section className="product-composer"><div><p className="eyebrow">Nova rotina</p><h2>O que você quer repetir?</h2></div><form action={createRoutine}><input name="title" required maxLength={120} placeholder="Ex.: caminhar por 20 minutos" /><button className="button button-primary">Adicionar rotina</button></form></section>
      <section className="routine-list"><div className="section-title"><div><p className="eyebrow">Hoje</p><h2>{done.size} de {(routines ?? []).length} concluídas</h2></div></div>{(routines ?? []).length ? (routines ?? []).map((routine) => { const completed = done.has(routine.id); return <article key={routine.id} className={completed ? 'routine-row completed' : 'routine-row'}><form action={toggleRoutine.bind(null, routine.id, today, !completed)}><button className="routine-check" aria-label={completed ? 'Desmarcar rotina' : 'Concluir rotina'}>{completed ? '✓' : ''}</button></form><div><strong>{routine.title}</strong><span>{completed ? 'Feito hoje. Muito bem.' : 'Ainda há tempo, sem pressa.'}</span></div><form action={deleteRoutine.bind(null, routine.id)}><button className="delete-button" aria-label="Excluir rotina">×</button></form></article> }) : <p className="day-empty">Sua primeira rotina pode ser bem pequena. É assim que a constância começa.</p>}</section>
    </>}</section></main>
}
