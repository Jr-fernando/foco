'use client'

import { useEffect, useState } from 'react'

const FOCUS_SECONDS = 25 * 60

function formatTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export function FocusTimer() {
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_SECONDS)
  const [isRunning, setIsRunning] = useState(false)
  const [sessions, setSessions] = useState(0)

  useEffect(() => {
    if (!isRunning) return

    const interval = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current > 1) return current - 1
        window.clearInterval(interval)
        setIsRunning(false)
        setSessions((value) => value + 1)
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Foco concluído', { body: 'Ótimo trabalho. Faça uma pausa breve antes do próximo bloco.' })
        }
        return FOCUS_SECONDS
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [isRunning])

  async function startFocus() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
    setIsRunning((value) => !value)
  }

  return (
    <section className="focus-timer" aria-label="Temporizador de foco">
      <div><p className="eyebrow">Bloco de foco</p><strong>{formatTime(secondsLeft)}</strong><span>{sessions ? `${sessions} bloco${sessions === 1 ? '' : 's'} concluído${sessions === 1 ? '' : 's'} hoje` : '25 minutos para uma coisa importante'}</span></div>
      <div className="timer-actions">
        <button className="timer-start" onClick={startFocus}>{isRunning ? 'Pausar' : 'Começar foco'}</button>
        <button className="timer-reset" onClick={() => { setIsRunning(false); setSecondsLeft(FOCUS_SECONDS) }}>Reiniciar</button>
      </div>
    </section>
  )
}
