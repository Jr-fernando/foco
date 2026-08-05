'use client'

import { useState, useTransition } from 'react'
import { createTask, toggleTask, deleteTask } from './actions/tasks'

type Task = {
  id: string
  title: string
  priority: 'alta' | 'media' | 'baixa'
  done: boolean
  category: string | null
}

type Streak = { current_streak: number; longest_streak: number }

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
  const [isPending, startTransition] = useTransition()
  const [filter, setFilter] = useState<'pendentes' | 'todas' | 'concluidas'>('pendentes')

  const pending = tasks.filter((t) => !t.done)
  const done = tasks.filter((t) => t.done)
  const visible = filter === 'pendentes' ? pending : filter === 'concluidas' ? done : tasks

  async function handleCreate(formData: FormData) {
    const result = await createTask(formData)
    if (!result.error) {
      // otimista o bastante: revalidatePath já cuida do refetch real
      startTransition(() => {})
    }
  }

  async function handleToggle(id: string, current: boolean) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !current } : t)))
    await toggleTask(id, !current)
  }

  async function handleDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    await deleteTask(id)
  }

  return (
    <main>
      <header>
        <div>
          <strong>Foco</strong>
          <span>{userEmail}</span>
        </div>
        <div aria-label="Sequência de dias ativos">
          🔥 {initialStreak.current_streak} dias seguidos
        </div>
      </header>

      <section aria-label="Progresso do dia">
        {tasks.length > 0 ? Math.round((done.length / tasks.length) * 100) : 0}% concluído —{' '}
        {done.length} de {tasks.length}
      </section>

      <form action={handleCreate}>
        <input type="text" name="title" placeholder="O que você precisa fazer?" required maxLength={280} />
        <select name="priority" defaultValue="media">
          <option value="alta">Alta prioridade</option>
          <option value="media">Prioridade média</option>
          <option value="baixa">Baixa prioridade</option>
        </select>
        <button type="submit" disabled={isPending}>Adicionar</button>
      </form>

      <nav>
        <button onClick={() => setFilter('pendentes')} aria-current={filter === 'pendentes'}>
          Pendentes ({pending.length})
        </button>
        <button onClick={() => setFilter('todas')} aria-current={filter === 'todas'}>
          Todas ({tasks.length})
        </button>
        <button onClick={() => setFilter('concluidas')} aria-current={filter === 'concluidas'}>
          Concluídas ({done.length})
        </button>
      </nav>

      <ul>
        {visible.map((task) => (
          <li key={task.id}>
            <button
              onClick={() => handleToggle(task.id, task.done)}
              aria-label={task.done ? 'Marcar como pendente' : 'Marcar como concluída'}
            >
              {task.done ? '✓' : '○'}
            </button>
            <span style={{ textDecoration: task.done ? 'line-through' : 'none' }}>{task.title}</span>
            <em>{task.priority}</em>
            <button onClick={() => handleDelete(task.id)} aria-label="Excluir tarefa">✕</button>
          </li>
        ))}
        {visible.length === 0 && <li>Nada por aqui.</li>}
      </ul>
    </main>
  )
}
