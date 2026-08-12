'use client'

import { useEffect, useState, type CSSProperties } from 'react'

const modes = [{ minutes: 15, label: 'Sprint' }, { minutes: 25, label: 'Clássico' }, { minutes: 45, label: 'Profundo' }]

function formatTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export function FocusTimer({ expanded = false }: { expanded?: boolean }) {
  const [minutes, setMinutes] = useState(25)
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const [intention, setIntention] = useState('')

  useEffect(() => {
    const key = `foco-sessions-${new Date().toISOString().slice(0, 10)}`
    const saved = Number(localStorage.getItem(key) ?? 0)
    const frame = requestAnimationFrame(() => setSessions(Number.isFinite(saved) ? saved : 0))
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (!isRunning) return

    const interval = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current > 1) return current - 1
        window.clearInterval(interval)
        setIsRunning(false)
        setSessions((value) => {
          const next = value + 1
          localStorage.setItem(`foco-sessions-${new Date().toISOString().slice(0, 10)}`, String(next))
          return next
        })
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Foco concluído', { body: 'Ótimo trabalho. Faça uma pausa breve antes do próximo bloco.' })
        }
        return minutes * 60
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [isRunning, minutes])

  function selectMode(value: number) {
    setIsRunning(false)
    setMinutes(value)
    setSecondsLeft(value * 60)
  }

  async function startFocus() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
    setIsRunning((value) => !value)
  }

  return (
    <section className={`focus-timer focus-timer-complete${expanded ? ' expanded' : ''}`} aria-label="Temporizador de foco">
      {expanded ? <><div className="focus-modes" aria-label="Duração do bloco">{modes.map((mode) => <button type="button" key={mode.minutes} className={minutes === mode.minutes ? 'active' : ''} onClick={() => selectMode(mode.minutes)} disabled={isRunning}>{mode.label}<small>{mode.minutes} min</small></button>)}</div><label className="focus-intention"><span>Intenção deste bloco</span><input value={intention} onChange={(event) => setIntention(event.target.value)} maxLength={90} placeholder="Ex.: terminar a primeira versão" /></label></> : null}
      <div className="timer-display"><div className="timer-face" style={{ '--timer-progress': `${Math.round((1 - secondsLeft / (minutes * 60)) * 360)}deg` } as CSSProperties}><strong>{formatTime(secondsLeft)}</strong></div><div className="timer-context"><p className="eyebrow">{intention || 'Bloco de foco'}</p><span>{sessions ? `${sessions} bloco${sessions === 1 ? '' : 's'} concluído${sessions === 1 ? '' : 's'} hoje` : `${minutes} minutos para uma coisa importante`}</span></div></div>
      <div className="timer-actions">
        <button className="timer-start" onClick={startFocus}>{isRunning ? 'Pausar' : 'Começar foco'}</button>
        <button className="timer-reset" onClick={() => { setIsRunning(false); setSecondsLeft(minutes * 60) }}>Reiniciar</button>
      </div>
    </section>
  )
}
