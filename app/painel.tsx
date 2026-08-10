'use client'

import { useState } from 'react'
import { createTask, toggleTask, deleteTask, scheduleTask } from './actions/tasks'
import { signOut } from './actions/auth'
import { FocusTimer } from './focus-timer'

type Task = {
  id: string
  title: string
  priority: 'alta' | 'media' | 'baixa'
  done: boolean
  category: string | null
  scheduled_for: string | null
  estimate_minutes: number | null
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
}: {
  initialTasks: Task[]
  initialStreak: Streak
  userEmail: string
}) {
  const [tasks, setTasks] = useState(initialTasks)
  const [filter, setFilter] = useState<Filter>('pendentes')
  const [categoryFilter, setCategoryFilter] = useState('todas')
  const [notice, setNotice] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [updatingTask, setUpdatingTask] = useState<string | null>(null)

  const pending = tasks.filter((task) => !task.done)
  const done = tasks.filter((task) => task.done)
  const todayTasks = pending.filter((task) => task.scheduled_for === today)
  const filteredByStatus = filter === 'pendentes' ? pending : filter === 'concluidas' ? done : tasks
  const visible = categoryFilter === 'todas'
    ? filteredByStatus
    : filteredByStatus.filter((task) => task.category === categoryFilter)
  const progress = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0

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

        <div className="hero-grid">
          <div>
            <p className="eyebrow">Seu espaço de clareza</p>
            <h1>Um passo de cada vez.</h1>
            <p className="hero-copy">Escolha o que importa agora. O resto pode esperar.</p>
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
            <span>{done.length} de {tasks.length} tarefas</span>
          </div>
          <div className="progress-track" aria-hidden="true">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </section>

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
          <article className="pro-preview">
            <span className="plan-badge">Foco Pro · em breve</span>
            <h2>Quando quiser ir além.</h2>
            <p>Histórico, lembretes e visões por projeto para transformar seu ritmo em clareza.</p>
            <a href="/planos">Ver planos <span aria-hidden="true">→</span></a>
          </article>
        </section>
      </section>
    </main>
  )
}
