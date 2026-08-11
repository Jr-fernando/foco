'use client'

import { useMemo, useState, useTransition } from 'react'
import { createTask, scheduleTask } from '../actions/tasks'

type Task = { id: string; title: string; priority: string; scheduled_for: string | null; estimate_minutes: number | null; done: boolean }
const formatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
const rangeFormatter = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' })
const weekdayFormatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
const narrowWeekdayFormatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'narrow' })

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function fromDateKey(value: string) { return new Date(`${value}T12:00:00`) }

function startOfWeek(reference: Date) {
  const date = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate(), 12)
  const day = date.getDay()
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1))
  return date
}

export function Planejador({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()))
  const [notice, setNotice] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const dates = useMemo(() => Array.from({ length: 7 }, (_, index) => { const date = new Date(weekStart); date.setDate(date.getDate() + index); return toDateKey(date) }), [weekStart])
  const today = toDateKey(new Date())
  const visible = new Set(dates)
  const unscheduled = tasks.filter((task) => !task.scheduled_for)
  const outsideWeek = tasks.filter((task) => task.scheduled_for && !visible.has(task.scheduled_for))
  const weekTasks = tasks.filter((task) => visible.has(task.scheduled_for ?? ''))
  const totalMinutes = weekTasks.reduce((sum, task) => sum + (task.estimate_minutes ?? 0), 0)
  const selectedTasks = tasks.filter((task) => task.scheduled_for === selectedDate)
  const selectedMinutes = selectedTasks.reduce((sum, task) => sum + (task.estimate_minutes ?? 0), 0)

  function changeWeek(amount: number) {
    setWeekStart((current) => {
      const next = new Date(current)
      next.setDate(next.getDate() + amount * 7)
      setSelectedDate(toDateKey(next))
      return next
    })
  }

  function goToday() {
    setWeekStart(startOfWeek(new Date()))
    setSelectedDate(today)
  }

  function move(taskId: string, date: string | null) {
    const previous = tasks
    setNotice(null)
    setTasks((current) => current.map((task) => task.id === taskId ? { ...task, scheduled_for: date } : task))
    startTransition(async () => {
      try {
        const result = await scheduleTask(taskId, date)
        if (result.error) { setTasks(previous); setNotice({ type: 'error', text: result.error }); return }
        setNotice({ type: 'success', text: date ? 'Tarefa adicionada ao calendário.' : 'Tarefa voltou para a caixa de entrada.' })
      } catch {
        setTasks(previous)
        setNotice({ type: 'error', text: 'A conexão falhou. A alteração não foi salva.' })
      }
    })
  }

  function quickCreate(formData: FormData) {
    setNotice(null)
    startTransition(async () => {
      try {
        const result = await createTask(formData)
        if (result.error || !result.task) { setNotice({ type: 'error', text: result.error ?? 'Não foi possível criar a tarefa.' }); return }
        setTasks((current) => [result.task as Task, ...current])
        setNotice({ type: 'success', text: 'Tarefa criada e colocada no calendário.' })
      } catch { setNotice({ type: 'error', text: 'A conexão falhou. Tente novamente.' }) }
    })
  }

  return <>
    <section className="secondary-hero planner-hero"><p className="eyebrow">Planejamento semanal</p><h1>Coloque cada coisa no seu lugar.</h1><p>Arraste tarefas para os dias no computador ou use os botões rápidos no celular. Tudo é salvo automaticamente.</p></section>
    <section className="planner-toolbar" aria-label="Controles do calendário"><div><button type="button" onClick={() => changeWeek(-1)} aria-label="Semana anterior">←</button><button type="button" className="today-button" onClick={goToday}>Hoje</button><button type="button" onClick={() => changeWeek(1)} aria-label="Próxima semana">→</button></div><strong>{rangeFormatter.format(fromDateKey(dates[0]))} — {rangeFormatter.format(fromDateKey(dates[6]))}</strong><span>{weekTasks.length} tarefas · {totalMinutes} min</span></section>
    {notice && <p className={notice.type === 'error' ? 'notice planner-notice error' : 'notice planner-notice'} role="status">{notice.text}</p>}
    <form className="quick-plan" action={quickCreate}><label><span>O que você quer fazer?</span><input name="title" required maxLength={280} placeholder="Ex.: preparar apresentação" /></label><label><span>Dia selecionado</span><input name="scheduledFor" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></label><label><span>Duração</span><select name="estimateMinutes" defaultValue="30"><option value="15">15 min</option><option value="30">30 min</option><option value="60">1 hora</option><option value="90">1h30</option></select></label><input type="hidden" name="priority" value="media" /><button className="button button-primary" disabled={isPending}>Adicionar em {weekdayFormatter.format(fromDateKey(selectedDate))}</button></form>
    <section className="selected-day-summary" aria-live="polite"><div><span>Dia em foco</span><strong>{formatter.format(fromDateKey(selectedDate))}</strong></div><p>{selectedTasks.length ? `${selectedTasks.length} tarefa${selectedTasks.length > 1 ? 's' : ''} · ${selectedMinutes || 'sem tempo estimado'}${selectedMinutes ? ' min planejados' : ''}` : 'Dia livre — clique em adicionar para reservar o primeiro passo.'}</p><div className="day-shortcuts">{dates.map((date) => <button type="button" key={date} className={date === selectedDate ? 'active' : ''} onClick={() => setSelectedDate(date)} aria-label={`Selecionar ${formatter.format(fromDateKey(date))}`}>{narrowWeekdayFormatter.format(fromDateKey(date))}<small>{fromDateKey(date).getDate()}</small></button>)}</div></section>
    <section className="week-board" aria-label="Calendário semanal">{dates.map((date) => { const dayTasks = tasks.filter((task) => task.scheduled_for === date); const selected = date === selectedDate; return <article key={date} className={`day-column ${date === today ? 'is-today' : ''} ${selected ? 'is-selected' : ''} ${dragging ? 'can-drop' : ''}`} onClick={() => setSelectedDate(date)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const id = event.dataTransfer.getData('text/task-id'); if (id) move(id, date); setSelectedDate(date); setDragging(null) }}><header><button type="button" className="day-select" onClick={() => setSelectedDate(date)} aria-pressed={selected}><span>{formatter.format(fromDateKey(date))}</span><small>{dayTasks.length ? `${dayTasks.length} tarefa${dayTasks.length > 1 ? 's' : ''}` : 'Livre'}</small></button><div>{date === today && <span>Hoje</span>}{selected && <span className="selected-pill">Selecionado</span>}</div></header><div className="day-task-list">{dayTasks.map((task) => <article key={task.id} className={`planned-task priority-${task.priority}`} draggable onDragStart={(event) => { event.dataTransfer.setData('text/task-id', task.id); setDragging(task.id) }} onDragEnd={() => setDragging(null)}><strong>{task.title}</strong><span>{task.estimate_minutes ? `${task.estimate_minutes} min` : 'Sem duração'}</span><button type="button" disabled={isPending} onClick={(event) => { event.stopPropagation(); move(task.id, null) }}>Retirar</button></article>)}{!dayTasks.length && <p className="day-empty">Clique para selecionar este dia</p>}</div></article> })}</section>
    <section className="inbox-card planner-inbox"><div><p className="eyebrow">Caixa de entrada</p><h2>Tarefas sem dia</h2><p>Arraste para o calendário ou escolha uma data.</p></div><div className="inbox-list">{unscheduled.map((task) => <article key={task.id} draggable onDragStart={(event) => { event.dataTransfer.setData('text/task-id', task.id); setDragging(task.id) }} onDragEnd={() => setDragging(null)}><div><strong>{task.title}</strong><span>{task.estimate_minutes ? `${task.estimate_minutes} min` : 'Sem estimativa'}</span></div><div className="schedule-actions"><button type="button" onClick={() => move(task.id, today)}>Hoje</button><button type="button" onClick={() => move(task.id, dates[1])}>Amanhã</button><input aria-label={`Escolher data para ${task.title}`} type="date" onChange={(event) => event.target.value && move(task.id, event.target.value)} /></div></article>)}{!unscheduled.length && <p className="day-empty">Tudo já tem um lugar na sua semana.</p>}</div></section>
    {outsideWeek.length > 0 && <section className="outside-week"><strong>{outsideWeek.length} tarefa{outsideWeek.length > 1 ? 's' : ''} em outras semanas</strong><button type="button" onClick={() => setWeekStart(startOfWeek(fromDateKey(outsideWeek[0].scheduled_for!)))}>Ver próxima tarefa</button></section>}
  </>
}
