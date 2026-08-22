'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { createTask, toggleTask, deleteTask, scheduleTask } from './actions/tasks'
import { signOut } from './actions/auth'
import { FocusTimer } from './focus-timer'
import { AppNav } from './components/app-nav'
import { PlanBadge } from './components/plan-badge'
import { TaskDetailSheet } from './components/task-detail-sheet'
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
  kind: 'task' | 'idea'
}

type Streak = { current_streak: number; longest_streak: number }
type Filter = 'pendentes' | 'todas' | 'concluidas'

const priorityLabel = { alta: 'Alta', media: 'Média', baixa: 'Baixa' }
const categories = ['Trabalho', 'Pessoal', 'Rotina', 'Ideias'] as const
const today = new Date().toISOString().slice(0, 10)
const todayLabel = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${today}T12:00:00`))
const moods = [{ value: 'leve', icon: '☀', label: 'Leve' }, { value: 'bem', icon: '◡', label: 'Bem' }, { value: 'neutro', icon: '—', label: 'Neutro' }, { value: 'cansado', icon: '☾', label: 'Cansado' }] as const

export function Painel({
  initialTasks,
  initialStreak,
  userEmail,
  projects,
  currentPlan,
  userId,
}: {
  initialTasks: Task[]
  initialStreak: Streak
  userEmail: string
  projects: Array<{ id: string; name: string }>
  currentPlan: ProductPlan
  userId: string
}) {
  const [tasks, setTasks] = useState(initialTasks)
  const [filter, setFilter] = useState<Filter>('pendentes')
  const [categoryFilter, setCategoryFilter] = useState('todas')
  const [notice, setNotice] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [updatingTask, setUpdatingTask] = useState<string | null>(null)
  const [composerOpen, setComposerOpen] = useState(false)
  const [mood, setMood] = useState('')
  const [captureKind, setCaptureKind] = useState<'task' | 'idea'>('task')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const composerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem(`foco-mood-${today}`) ?? ''
    const frame = requestAnimationFrame(() => setMood(saved))
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('capture') === '1') openComposer()
  }, [])

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== 'q' || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return
      event.preventDefault()
      openComposer()
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  const summary = useMemo(() => {
    const pending: Task[] = []
    const done: Task[] = []
    const todayTasks: Task[] = []
    const todayDone: Task[] = []
    let todayMinutes = 0
    let inbox = 0
    let urgent = 0
    const overdue: Task[] = []
    for (const task of tasks) {
      if (task.done) done.push(task); else pending.push(task)
      if (!task.scheduled_for && !task.done) inbox += 1
      if (task.priority === 'alta' && !task.done) urgent += 1
      if (task.scheduled_for && task.scheduled_for < today && !task.done) overdue.push(task)
      if (task.scheduled_for === today) {
        todayMinutes += task.estimate_minutes ?? 0
        if (task.done) todayDone.push(task); else todayTasks.push(task)
      }
    }
    return { pending, done, todayTasks, todayDone, todayMinutes, inbox, urgent, overdue }
  }, [tasks])
  const { pending, done, todayTasks, todayDone, todayMinutes, inbox, urgent, overdue } = summary
  const filteredByStatus = filter === 'pendentes' ? pending : filter === 'concluidas' ? done : tasks
  const visible = categoryFilter === 'todas'
    ? filteredByStatus
    : filteredByStatus.filter((task) => task.category === categoryFilter)
  const todayTotal = todayTasks.length + todayDone.length
  const progress = todayTotal ? Math.round((todayDone.length / todayTotal) * 100) : 0
  const ideas = pending.filter((task) => task.kind === 'idea' && !task.scheduled_for)
  const nextTask = overdue[0] ?? todayTasks[0] ?? pending.find((task) => task.kind === 'task')
  const capacity = Math.min(100, Math.round((todayMinutes / 360) * 100))
  const firstName = (userEmail.split('@')[0].split(/[._-]/)[0] || 'você').replace(/^./, (letter) => letter.toUpperCase())

  async function handleCreate(formData: FormData) {
    setIsCreating(true)
    setNotice(null)
    const result = await createTask(formData)
    setIsCreating(false)

    if (result.error) {
      setNotice(result.error)
      return
    }

    formRef.current?.reset()
    setComposerOpen(false)
    if (result.task) {
      const created = result.task as Task
      setTasks((previous) => [created, ...previous])
      if (String(formData.get('intent')) === 'details') setSelectedTask(created)
    }
    setNotice(captureKind === 'idea' ? 'Ideia guardada na sua caixa de entrada.' : 'Tarefa adicionada. Continue no seu ritmo.')
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

  function openComposer() {
    setComposerOpen(true)
    requestAnimationFrame(() => { composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); window.setTimeout(() => formRef.current?.querySelector('input')?.focus(), 350) })
  }

  function chooseMood(value: string) {
    setMood(value)
    localStorage.setItem(`foco-mood-${today}`, value)
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
        <AppNav active="/painel" onCapture={openComposer} />

        <header className="focus-home-header"><div><p>{todayLabel}</p><div><h1>Olá, {firstName}.</h1><PlanBadge plan={currentPlan} /></div><span>{todayTotal ? `${todayTasks.length} ${todayTasks.length === 1 ? 'tarefa espera' : 'tarefas esperam'} por você hoje.` : 'Seu dia está livre para começar com intenção.'}</span></div><Link href="/ajustes" aria-label="Abrir perfil"><span>{userEmail.slice(0, 1).toUpperCase()}</span></Link></header>

        <section className="instant-capture" aria-label="Captura rápida"><button type="button" onClick={() => { setCaptureKind('task'); openComposer() }}><i aria-hidden="true">＋</i><span><strong>Nova tarefa</strong><small>O que precisa ser feito?</small></span><kbd>Q</kbd></button><button type="button" onClick={() => { setCaptureKind('idea'); openComposer() }}><i aria-hidden="true">✦</i><span><strong>Anotar ideia</strong><small>Guarde agora, organize depois</small></span><b aria-hidden="true">→</b></button></section>

        <section ref={composerRef} className={`task-composer capture-studio${composerOpen ? ' mobile-open' : ''}`} aria-labelledby="new-task-title">
          <div className="capture-intro"><div><p className="eyebrow">Caixa de entrada</p><h2 id="new-task-title">Tire da cabeça. Organize depois.</h2><span>Registre em segundos e abra os detalhes para incluir passos, notas e arquivos.</span></div><button type="button" className="mobile-composer-close" onClick={() => setComposerOpen(false)} aria-label="Fechar">×</button></div>
          <div className="capture-kind" role="group" aria-label="O que você quer registrar?"><button type="button" className={captureKind === 'task' ? 'active' : ''} onClick={() => setCaptureKind('task')}>✓ Tarefa</button><button type="button" className={captureKind === 'idea' ? 'active' : ''} onClick={() => setCaptureKind('idea')}>✦ Ideia</button></div>
          <form ref={formRef} action={handleCreate} data-task-form className="task-form capture-form">
            <input type="hidden" name="kind" value={captureKind} />
            <label className="sr-only" htmlFor="task-title">{captureKind === 'idea' ? 'Nova ideia' : 'Nova tarefa'}</label>
            <input id="task-title" type="text" name="title" placeholder={captureKind === 'idea' ? 'Anote a ideia antes que ela escape...' : 'O que precisa ser feito?'} required maxLength={280} autoComplete="off" />
            <div className="capture-options"><label><span>Quando</span><select key={`date-${captureKind}`} name="scheduledFor" defaultValue={captureKind === 'idea' ? '' : today}><option value={today}>Hoje</option><option value="">Sem data</option></select></label><label><span>Prioridade</span><select name="priority" defaultValue="media"><option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option></select></label><label><span>Categoria</span><select key={`category-${captureKind}`} name="category" defaultValue={captureKind === 'idea' ? 'Ideias' : ''}><option value="">Sem categoria</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label><label><span>Duração</span><select name="estimateMinutes" defaultValue="25"><option value="15">15 min</option><option value="25">25 min</option><option value="45">45 min</option><option value="60">1 hora</option></select></label>{projects.length > 0 && <label><span>Projeto</span><select name="projectId" defaultValue=""><option value="">Sem projeto</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>}</div>
            <div className="capture-actions"><button className="button button-soft" type="submit" name="intent" value="quick" disabled={isCreating}>Só salvar</button><button className="button button-primary" type="submit" name="intent" value="details" disabled={isCreating}>{isCreating ? 'Salvando...' : 'Salvar e adicionar detalhes'}</button></div>
          </form>
        </section>

        <section className="focus-workspace" aria-label="Visão do dia"><div className="focus-main-column">
          <article className="next-action-card"><div className="next-action-label"><i aria-hidden="true">◎</i><span>Agora</span></div>{nextTask ? <><button type="button" className="next-action-title" onClick={() => setSelectedTask(nextTask)}>{nextTask.title}</button><div><span>{nextTask.estimate_minutes ? `${nextTask.estimate_minutes} min` : 'Sem duração'}{nextTask.category ? ` · ${nextTask.category}` : ''}</span><Link href="/foco">Começar foco <b>→</b></Link></div></> : <><strong>Escolha seu primeiro passo</strong><p>Planeje uma tarefa para hoje e ela aparece aqui.</p><Link href="/planejar">Abrir planejamento →</Link></>}</article>
          <section className="my-day-card"><header><div><p className="eyebrow">Meu dia</p><h2>Hoje</h2></div><div className="day-progress-ring" style={{ '--day-progress': `${progress * 3.6}deg` } as React.CSSProperties}><span>{progress}%</span></div></header>{overdue.length ? <div className="day-list-block"><strong className="day-list-label overdue-label">Atrasadas · {overdue.length}</strong>{overdue.slice(0, 3).map((task) => <article className="focus-task-row" key={task.id}><button className="check-button" onClick={() => handleToggle(task.id, task.done)} disabled={updatingTask === task.id} aria-label={`Concluir ${task.title}`} /><button className="focus-task-title" onClick={() => setSelectedTask(task)}>{task.title}<small>{task.category ?? 'Sem categoria'}{task.estimate_minutes ? ` · ${task.estimate_minutes} min` : ''}</small></button><span className="row-overdue">Atrasada</span></article>)}</div> : null}<div className="day-list-block"><strong className="day-list-label">Planejadas · {todayTasks.length}</strong>{todayTasks.length ? todayTasks.map((task) => <article className="focus-task-row" key={task.id}><button className="check-button" onClick={() => handleToggle(task.id, task.done)} disabled={updatingTask === task.id} aria-label={`Concluir ${task.title}`} /><button className="focus-task-title" onClick={() => setSelectedTask(task)}>{task.kind === 'idea' ? '✦ ' : ''}{task.title}<small>{task.category ?? 'Sem categoria'}{task.estimate_minutes ? ` · ${task.estimate_minutes} min` : ''}</small></button><span className={`priority-dot ${task.priority}`} aria-label={`Prioridade ${priorityLabel[task.priority]}`} /></article>) : <div className="calm-empty"><span aria-hidden="true">✓</span><div><strong>Nenhuma tarefa planejada</strong><p>Seu dia está leve. Adicione apenas o que realmente cabe.</p></div></div>}</div><button type="button" className="day-add-button" onClick={() => { setCaptureKind('task'); openComposer() }}>＋ Adicionar ao meu dia</button></section>
          <section className="inbox-preview"><header><div><p className="eyebrow">Caixa de entrada</p><h2>Para organizar depois</h2></div><Link href="/planejar">Organizar {inbox} <span>→</span></Link></header><div>{ideas.slice(0, 3).map((task) => <button type="button" key={task.id} onClick={() => setSelectedTask(task)}><i aria-hidden="true">✦</i><span><strong>{task.title}</strong><small>Ideia</small></span><b>›</b></button>)}{!ideas.length ? <p className="inbox-empty">Ideias e tarefas sem data ficam guardadas aqui, sem bagunçar seu dia.</p> : null}</div></section>
        </div><aside className="focus-side-column">
          <section className="day-balance-card"><header><span>Ritmo do dia</span><strong>{todayMinutes ? `${Math.floor(todayMinutes / 60)}h${todayMinutes % 60 ? ` ${todayMinutes % 60}min` : ''}` : 'Livre'}</strong></header><div className="capacity-track"><i style={{ width: `${capacity}%` }} /></div><p>{capacity > 85 ? 'Seu dia está cheio. Proteja espaço para pausas.' : capacity > 55 ? 'Um ritmo possível, com espaço para respirar.' : 'Ainda há espaço, mas você não precisa preenchê-lo.'}</p><dl><div><dt>Concluídas</dt><dd>{todayDone.length}/{todayTotal}</dd></div><div><dt>Prioridade alta</dt><dd>{urgent}</dd></div><div><dt>Sem data</dt><dd>{inbox}</dd></div></dl></section>
          <FocusTimer />
          <section className="consistency-card"><div><span aria-hidden="true">↗</span><p><strong>{initialStreak.current_streak} dias de ritmo</strong><small>Seu melhor: {initialStreak.longest_streak} dias</small></p></div><Link href="/insights">Ver progresso →</Link></section>
          <nav className="side-shortcuts" aria-label="Atalhos"><Link href="/planejar"><i>▦</i><span><strong>Planejar</strong><small>Organize sua semana</small></span><b>›</b></Link><Link href="/rotinas"><i>↻</i><span><strong>Rotinas</strong><small>Construa constância</small></span><b>›</b></Link><Link href="/projetos"><i>◇</i><span><strong>Projetos</strong><small>Avance por etapas</small></span><b>›</b></Link></nav>
        </aside></section>

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
                <button type="button" className="task-title task-open" onClick={() => setSelectedTask(task)}>{task.kind === 'idea' ? <i aria-hidden="true">✦</i> : null}{task.title}</button>
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

        <section className="dashboard-lower legacy-dashboard-lower" aria-label="Continue construindo seu ritmo">
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
        <section className="mood-card home-mood"><div><p className="eyebrow">Check-in rápido</p><h2>Como está sua energia agora?</h2><span>Isso fica somente neste dispositivo.</span></div><div>{moods.map((item) => <button type="button" key={item.value} className={mood === item.value ? 'active' : ''} onClick={() => chooseMood(item.value)} aria-pressed={mood === item.value}><i aria-hidden="true">{item.icon}</i><span>{item.label}</span></button>)}</div></section>
      </section>
      <TaskDetailSheet key={selectedTask?.id ?? 'closed'} task={selectedTask} userId={userId} onClose={() => setSelectedTask(null)} />
    </main>
  )
}
