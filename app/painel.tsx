'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { createTask, toggleTask, deleteTask, scheduleTask } from './actions/tasks'
import { signOut } from './actions/auth'
import { FocusTimer } from './focus-timer'
import { AppNav } from './components/app-nav'
import { PlanBadge } from './components/plan-badge'
import type { ProductPlan } from '@/lib/plans'

type Task = {
  id: string
  title: string
  priority: 'alta' | 'media' | 'baixa'
  done: boolean
  category: string | null
  scheduled_for: string | null
  estimate_minutes: number | null
  project_id: string | null
}

type Streak = { current_streak: number; longest_streak: number }
type Filter = 'pendentes' | 'todas' | 'concluidas'

const priorityLabel = { alta: 'Alta', media: 'Média', baixa: 'Baixa' }
const categories = ['Trabalho', 'Pessoal', 'Rotina', 'Ideias'] as const
const today = new Date().toISOString().slice(0, 10)

export function Painel({
  initialTasks,
  initialStreak,
  userEmail,
  projects,
  currentPlan,
}: {
  initialTasks: Task[]
  initialStreak: Streak
  userEmail: string
  projects: Array<{ id: string; name: string }>
  currentPlan: ProductPlan
}) {
  const [tasks, setTasks] = useState(initialTasks)
  const [filter, setFilter] = useState<Filter>('pendentes')
  const [categoryFilter, setCategoryFilter] = useState('todas')
  const [notice, setNotice] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [updatingTask, setUpdatingTask] = useState<string | null>(null)

  const summary = useMemo(() => {
    const pending: Task[] = []
    const done: Task[] = []
    const todayTasks: Task[] = []
    const todayDone: Task[] = []
    let todayMinutes = 0
    let inbox = 0
    let urgent = 0
    for (const task of tasks) {
      if (task.done) done.push(task); else pending.push(task)
      if (!task.scheduled_for && !task.done) inbox += 1
      if (task.priority === 'alta' && !task.done) urgent += 1
      if (task.scheduled_for === today) {
        todayMinutes += task.estimate_minutes ?? 0
        if (task.done) todayDone.push(task); else todayTasks.push(task)
      }
    }
    return { pending, done, todayTasks, todayDone, todayMinutes, inbox, urgent }
  }, [tasks])
  const { pending, done, todayTasks, todayDone, todayMinutes, inbox, urgent } = summary
  const filteredByStatus = filter === 'pendentes' ? pending : filter === 'concluidas' ? done : tasks
  const visible = categoryFilter === 'todas'
    ? filteredByStatus
    : filteredByStatus.filter((task) => task.category === categoryFilter)
  const todayTotal = todayTasks.length + todayDone.length
  const progress = todayTotal ? Math.round((todayDone.length / todayTotal) * 100) : 0

  async function handleCreate(formData: FormData) {
    setIsCreating(true)
    setNotice(null)
    const result = await createTask(formData)
    setIsCreating(false)

    if (result.error) {
      setNotice(result.error)
      return
    }

    const form = document.querySelector<HTMLFormElement>('[data-task-form]')
    form?.reset()
    if (result.task) setTasks((previous) => [result.task as Task, ...previous])
    setNotice('Tarefa adicionada. Continue no seu ritmo.')
  }

  async function handleToggle(id: string, current: boolean) {
    setNotice(null)
    setUpdatingTask(id)
    setTasks((previous) => previous.map((task) => (task.id === id ? { ...task, done: !current } : task)))

    const result = await toggleTask(id, !current)
    setUpdatingTask(null)

    if (result.error) {
      setTasks((previous) => previous.map((task) => (task.id === id ? { ...task, done: current } : task)))
      setNotice(result.error)
    }
  }

  async function handleDelete(id: string) {
    const removed = tasks.find((task) => task.id === id)
    if (!removed) return

    setNotice(null)
    setUpdatingTask(id)
    setTasks((previous) => previous.filter((task) => task.id !== id))

    const result = await deleteTask(id)
    setUpdatingTask(null)

    if (result.error) {
      setTasks((previous) => [removed, ...previous])
      setNotice(result.error)
    }
  }

  async function handleSchedule(id: string, scheduledFor: string | null) {
    const previous = tasks
    setNotice(null)
    setUpdatingTask(id)
    setTasks((current) => current.map((task) => task.id === id ? { ...task, scheduled_for: scheduledFor } : task))
    const result = await scheduleTask(id, scheduledFor)
    setUpdatingTask(null)
    if (result.error) {
      setTasks(previous)
      setNotice(result.error)
    }
  }

  return (
    <main className="app-shell">
      <section className="dashboard" aria-label="Painel de tarefas">
        <header className="topbar">
          <a className="brand" href="/painel" aria-label="Foco, painel">
            <span className="brand-mark">F</span>
            <span>foco</span>
          </a>
          <div className="account-actions">
            <div className="account">
              <span className="account-dot" aria-hidden="true" />
              <span>{userEmail}</span>
            </div>
            <form action={signOut}>
              <button className="signout-button" type="submit">Sair</button>
            </form>
          </div>
        </header>
        <AppNav active="/painel" />

        <div className="hero-grid">
          <div>
            <p className="eyebrow">Seu espaço de clareza</p>
            <div className="dashboard-title"><h1>Um passo de cada vez.</h1><PlanBadge plan={currentPlan} /></div>
            <p className="hero-copy">Escolha o que importa agora. O resto pode esperar.</p>
            <div className="hero-actions"><a className="button button-primary" href="#new-task-title">Adicionar tarefa</a><Link className="button button-soft" href="/planejar">Planejar semana</Link></div>
          </div>
          <aside className="streak-card" aria-label="Sequência de dias ativos">
            <span className="streak-icon" aria-hidden="true">↗</span>
            <div>
              <strong>{initialStreak.current_streak}</strong>
              <span>dias de ritmo</span>
            </div>
            <small>melhor: {initialStreak.longest_streak}</small>
          </aside>
        </div>

        <section className="progress-card" aria-label="Progresso do dia">
          <div className="progress-heading">
            <div>
              <span className="eyebrow">Hoje</span>
              <strong>{progress}% concluído</strong>
            </div>
            <span>{todayDone.length} de {todayTotal} tarefas de hoje</span>
          </div>
          <div className="progress-track" aria-hidden="true">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </section>

        <section className="dashboard-summary" aria-label="Resumo rápido"><article><span>Tempo planejado</span><strong>{todayMinutes ? `${Math.floor(todayMinutes / 60)}h${todayMinutes % 60 ? ` ${todayMinutes % 60}min` : ''}` : 'Livre'}</strong><small>para hoje</small></article><article><span>Caixa de entrada</span><strong>{inbox}</strong><small>{inbox === 1 ? 'tarefa sem data' : 'tarefas sem data'}</small></article><article><span>Prioridade alta</span><strong>{urgent}</strong><small>{urgent ? 'merecem decisão' : 'tudo sob controle'}</small></article><article className="summary-next"><span>Próxima ação</span><strong>{todayTasks[0]?.title ?? pending[0]?.title ?? 'Respire e escolha com calma'}</strong><Link href={todayTasks.length ? '/foco' : '/planejar'}>{todayTasks.length ? 'Entrar em foco' : 'Organizar agora'} →</Link></article></section>

        <section className="daily-focus-grid" aria-label="Planejamento de hoje">
          <article className="today-card">
            <div className="today-card-heading"><div><p className="eyebrow">Meu dia</p><h2>O que merece sua atenção?</h2></div><span>{todayTasks.length}/3</span></div>
            {todayTasks.length ? (
              <ul>{todayTasks.slice(0, 3).map((task) => <li key={task.id}><span>{task.title}</span><button disabled={updatingTask === task.id} onClick={() => handleSchedule(task.id, null)}>Remover</button></li>)}</ul>
            ) : <p className="today-empty">Escolha as tarefas que transformam intenção em um dia possível.</p>}
          </article>
          <FocusTimer />
        </section>

        <section className="task-composer" aria-labelledby="new-task-title">
          <div className="section-title">
            <div>
              <p className="eyebrow">Próximo passo</p>
              <h2 id="new-task-title">No que você quer focar?</h2>
            </div>
          </div>
          <form action={handleCreate} data-task-form className="task-form">
            <label className="sr-only" htmlFor="task-title">Nova tarefa</label>
            <input id="task-title" type="text" name="title" placeholder="Ex.: responder propostas pendentes" required maxLength={280} />
            <label className="sr-only" htmlFor="task-priority">Prioridade</label>
            <select id="task-priority" name="priority" defaultValue="media">
              <option value="alta">Alta prioridade</option>
              <option value="media">Prioridade média</option>
              <option value="baixa">Baixa prioridade</option>
            </select>
            <label className="sr-only" htmlFor="task-category">Categoria</label>
            <select id="task-category" name="category" defaultValue="">
              <option value="">Sem categoria</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <label className="sr-only" htmlFor="task-date">Quando fazer</label>
            <select id="task-date" name="scheduledFor" defaultValue={today}>
              <option value={today}>Hoje</option>
              <option value="">Sem data</option>
            </select>
            <label className="sr-only" htmlFor="task-estimate">Tempo estimado</label>
            <select id="task-estimate" name="estimateMinutes" defaultValue="25">
              <option value="15">15 min</option>
              <option value="25">25 min</option>
              <option value="45">45 min</option>
              <option value="60">1 hora</option>
            </select>
            {projects.length > 0 && <><label className="sr-only" htmlFor="task-project">Projeto</label><select id="task-project" name="projectId" defaultValue=""><option value="">Sem projeto</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name} · Pro</option>)}</select></>}
            <button className="button button-primary" type="submit" disabled={isCreating}>
              {isCreating ? 'Adicionando...' : 'Adicionar tarefa'}
            </button>
          </form>
        </section>

        {notice && <p className="notice" role="status">{notice}</p>}

        <section className="task-list-section" aria-labelledby="tasks-title">
          <div className="list-header">
            <h2 id="tasks-title">Suas tarefas</h2>
            <div className="list-controls">
              <nav className="filters" aria-label="Filtrar tarefas">
                {(['pendentes', 'todas', 'concluidas'] as Filter[]).map((item) => (
                  <button
                    key={item}
                    className={filter === item ? 'filter active' : 'filter'}
                    onClick={() => setFilter(item)}
                    aria-pressed={filter === item}
                  >
                    {item === 'pendentes' ? `Pendentes ${pending.length}` : item === 'todas' ? `Todas ${tasks.length}` : `Concluídas ${done.length}`}
                  </button>
                ))}
              </nav>
              <label className="sr-only" htmlFor="category-filter">Filtrar por categoria</label>
              <select id="category-filter" className="category-filter" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option value="todas">Todas as categorias</option>
                {categories.filter((category) => tasks.some((task) => task.category === category)).map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <ul className="task-list">
            {visible.map((task) => (
              <li className={task.done ? 'task done' : 'task'} key={task.id}>
                <button
                  className="check-button"
                  onClick={() => handleToggle(task.id, task.done)}
                  aria-label={task.done ? 'Marcar como pendente' : 'Marcar como concluída'}
                  disabled={updatingTask === task.id}
                >
                  {task.done && '✓'}
                </button>
                <span className="task-title">{task.title}</span>
                {task.category && <span className="task-category">{task.category}</span>}
                {task.scheduled_for === today ? <span className="today-tag">Hoje</span> : (
                  <button className="plan-button" disabled={updatingTask === task.id} onClick={() => handleSchedule(task.id, today)}>Planejar hoje</button>
                )}
                <span className={`priority priority-${task.priority}`}>{priorityLabel[task.priority]}</span>
                <button
                  className="delete-button"
                  onClick={() => handleDelete(task.id)}
                  aria-label={`Excluir ${task.title}`}
                  disabled={updatingTask === task.id}
                >
                  ×
                </button>
              </li>
            ))}
            {!visible.length && (
              <li className="empty-state">
                <span aria-hidden="true">◌</span>
                <strong>{filter === 'concluidas' ? 'Nada concluído por enquanto.' : 'Seu espaço está livre.'}</strong>
                <p>{filter === 'concluidas' ? 'Quando uma tarefa estiver pronta, ela aparece aqui.' : 'Adicione uma tarefa pequena para começar.'}</p>
              </li>
            )}
          </ul>
        </section>

        <section className="dashboard-lower" aria-label="Continue construindo seu ritmo">
          <article className="moment-card">
            <p className="eyebrow">Um lembrete para hoje</p>
            <h2>{pending.length ? 'Uma tarefa feita ainda conta como um dia bem vivido.' : 'Você criou espaço. Agora escolha o próximo passo com calma.'}</h2>
            <p>Não é sobre preencher todos os minutos. É sobre cuidar do que realmente merece sua atenção.</p>
          </article>
          <article className="pro-preview dashboard-explore">
            <span className="plan-badge">Explore o Foco</span>
            <h2>Mais clareza, menos troca de contexto.</h2>
            <div className="explore-links"><Link href="/rotinas"><strong>Rotinas</strong><span>Construa consistência →</span></Link><Link href="/insights"><strong>Insights</strong><span>Entenda seu ritmo →</span></Link><Link href="/projetos"><strong>Projetos</strong><span>Conecte os próximos passos →</span></Link></div>
          </article>
        </section>
      </section>
    </main>
  )
}
