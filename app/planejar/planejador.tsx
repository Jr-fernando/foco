'use client'

import { useState } from 'react'
import { scheduleTask } from '../actions/tasks'

type Task = { id: string; title: string; priority: string; scheduled_for: string | null; estimate_minutes: number | null; done: boolean }
const dates = Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() + index); return date.toISOString().slice(0, 10) })
const formatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })

export function Planejador({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function move(taskId: string, date: string | null) {
    const previous = tasks
    setBusy(taskId); setNotice(null)
    setTasks((current) => current.map((task) => task.id === taskId ? { ...task, scheduled_for: date } : task))
    const result = await scheduleTask(taskId, date)
    setBusy(null)
    if (result.error) { setTasks(previous); setNotice(result.error) }
  }

  const unscheduled = tasks.filter((task) => !task.scheduled_for)
  return <><section className="secondary-hero"><p className="eyebrow">Visão de 7 dias</p><h1>Planeje sem lotar a semana.</h1><p>Distribua o que importa e preserve espaços livres para a vida real.</p></section>{notice && <p className="notice">{notice}</p>}<section className="week-board" aria-label="Planejamento semanal">{dates.map((date) => <article key={date} className="day-column"><h2>{formatter.format(new Date(`${date}T12:00:00`))}</h2>{tasks.filter((task) => task.scheduled_for === date).map((task) => <div key={task.id} className="planned-task"><strong>{task.title}</strong><span>{task.estimate_minutes ? `${task.estimate_minutes} min` : 'Sem tempo definido'}</span><button disabled={busy === task.id} onClick={() => move(task.id, null)}>Retirar</button></div>)}{!tasks.some((task) => task.scheduled_for === date) && <p className="day-empty">Espaço disponível</p>}</article>)}</section><section className="inbox-card"><div><p className="eyebrow">Caixa de entrada</p><h2>Para decidir depois</h2></div><div className="inbox-list">{unscheduled.map((task) => <article key={task.id}><div><strong>{task.title}</strong><span>{task.estimate_minutes ? `${task.estimate_minutes} min` : 'Sem estimativa'}</span></div><select aria-label={`Planejar ${task.title}`} value="" disabled={busy === task.id} onChange={(event) => move(task.id, event.target.value || null)}><option value="">Planejar...</option>{dates.map((date) => <option key={date} value={date}>{formatter.format(new Date(`${date}T12:00:00`))}</option>)}</select></article>)}{!unscheduled.length && <p className="day-empty">Sua caixa de entrada está vazia.</p>}</div></section></>
}
