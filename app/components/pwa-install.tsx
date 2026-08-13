'use client'

import { useEffect, useState } from 'react'

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PwaInstall() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [iosHelp, setIosHelp] = useState(false)
  const [manualHelp, setManualHelp] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => undefined)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    const dismissed = localStorage.getItem('foco-install-dismissed-v1') === '1'
    if (standalone) return

    const onPrompt = (event: Event) => {
      event.preventDefault()
      setPrompt(event as InstallPromptEvent)
      if (!dismissed) window.setTimeout(() => setVisible(true), 1800)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    const onRequest = () => { localStorage.removeItem('foco-install-dismissed-v1'); if (!prompt) setManualHelp(true); setVisible(true) }
    window.addEventListener('foco-request-install', onRequest)

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
    if (isIos && !dismissed) window.setTimeout(() => { setIosHelp(true); setVisible(true) }, 1800)
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('foco-request-install', onRequest) }
  }, [prompt])

  async function install() {
    if (prompt) {
      await prompt.prompt()
      const choice = await prompt.userChoice
      if (choice.outcome === 'accepted') setVisible(false)
      setPrompt(null)
      return
    }
    if (iosHelp) setIosHelp(true)
  }

  function dismiss() {
    localStorage.setItem('foco-install-dismissed-v1', '1')
    setVisible(false)
  }

  if (!visible) return null
  const help = iosHelp && !prompt ? 'No Safari, toque em Compartilhar e depois em “Adicionar à Tela de Início”.' : manualHelp && !prompt ? 'Abra o menu do navegador e escolha “Instalar Foco” ou “Adicionar à tela inicial”.' : 'Instale como aplicativo. Abre mais rápido e fica na sua tela inicial.'
  return <aside className="install-card" aria-label="Instalar aplicativo Foco"><div className="install-icon">F</div><div><strong>Leve o Foco com você</strong><p>{help}</p></div><div className="install-actions">{prompt ? <button type="button" onClick={install}>Instalar</button> : null}<button type="button" className="install-later" onClick={dismiss}>{!prompt ? 'Entendi' : 'Agora não'}</button></div></aside>
}

export function InstallAppButton() {
  return <button type="button" className="button button-outline" onClick={() => window.dispatchEvent(new Event('foco-request-install'))}>Instalar o Foco</button>
}
