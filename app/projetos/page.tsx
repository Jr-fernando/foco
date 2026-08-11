import { createClient } from '@/lib/supabase/server'
import { getUserPlan, hasPlan } from '@/lib/plans'
import { AppNav } from '../components/app-nav'
import { PlanBadge } from '../components/plan-badge'
import { createProject, deleteProject } from '../actions/product'

export const dynamic = 'force-dynamic'

export default async function ProjetosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const plan = await getUserPlan(supabase, user.id)
  const unlocked = hasPlan(plan, 'pro')
  const { data: projects } = unlocked ? await supabase.from('projects').select('id,name,description,status,created_at').order('created_at', { ascending: false }) : { data: [] }
  const { data: tasks } = unlocked ? await supabase.from('tasks').select('project_id,done').not('project_id', 'is', null) : { data: [] }

  return <main className="app-shell"><section className="dashboard secondary-page"><header className="topbar"><a className="brand" href="/painel"><span className="brand-mark">F</span><span>foco</span></a><a className="account-link" href="/planos">Ver planos</a></header><AppNav active="/projetos" />
    <section className="secondary-hero product-hero"><div><p className="eyebrow">Visão de longo prazo</p><h1>Projetos com começo, meio e próximo passo.</h1><p>Transforme objetivos maiores em progresso visível e possível.</p></div><PlanBadge plan="pro" /></section>
    {!unlocked ? <section className="feature-lock pro-lock"><div className="lock-visual"><span>Projeto em movimento</span><strong>Lançar meu próximo projeto</strong><i style={{ width: '46%' }} /></div><div><PlanBadge plan="pro" /><h2>Conecte tarefas a objetivos maiores</h2><p>Acompanhe etapas, progresso e prioridades em um só lugar, sem perder a clareza do dia.</p><a className="button button-primary" href="/planos">Conhecer o plano Pro</a></div></section> : <>
      <section className="product-composer"><div><p className="eyebrow">Novo projeto</p><h2>O que você quer tirar do papel?</h2></div><form action={createProject}><input name="name" required maxLength={100} placeholder="Nome do projeto" /><input name="description" maxLength={500} placeholder="Resultado que você deseja alcançar" /><button className="button button-primary">Criar projeto</button></form></section>
      <section className="project-grid">{(projects ?? []).length ? (projects ?? []).map((project) => { const related = (tasks ?? []).filter((task) => task.project_id === project.id); const complete = related.filter((task) => task.done).length; const progress = related.length ? Math.round(complete / related.length * 100) : 0; return <article className="project-card" key={project.id}><div className="project-top"><PlanBadge plan="pro" compact /><form action={deleteProject.bind(null, project.id)}><button className="delete-button" aria-label="Excluir projeto">×</button></form></div><h2>{project.name}</h2><p>{project.description || 'Defina os próximos passos deste projeto.'}</p><div className="project-progress"><span><strong>{progress}%</strong> concluído</span><div><i style={{ width: `${progress}%` }} /></div><small>{related.length} tarefas conectadas</small></div></article> }) : <p className="day-empty">Crie seu primeiro projeto e transforme uma ideia grande em passos menores.</p>}</section>
    </>}</section></main>
}
