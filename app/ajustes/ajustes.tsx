'use client'

import { useEffect, useState } from 'react'
import { openBillingPortal } from '../actions/billing'

const themes = [['original', 'Clareza', 'O tom natural do Foco.'], ['night', 'Noite calma', 'Para reduzir o brilho à noite.'], ['lavender', 'Lavanda', 'Um espaço mais suave e contemplativo.']] as const
type Subscription = { plan: string; status: string; billing_interval: string | null; current_period_end: string | null; cancel_at_period_end: boolean } | null
const planNames: Record<string, string> = { free: 'Gratuito', essential: 'Foco Essencial', pro: 'Foco Pro' }

export function Ajustes({ subscription }: { subscription: Subscription }) {
  const [theme, setTheme] = useState('original')
  useEffect(() => { const saved = localStorage.getItem('foco-theme') ?? 'original'; const frame = requestAnimationFrame(() => setTheme(saved)); return () => cancelAnimationFrame(frame) }, [])
  useEffect(() => { localStorage.setItem('foco-theme', theme); document.documentElement.dataset.theme = theme }, [theme])
  function select(value: string) { setTheme(value) }
  const isPaid = subscription && ['active', 'trialing', 'past_due'].includes(subscription.status)

  return <><section className="secondary-hero"><p className="eyebrow">Seu espaço</p><h1>Deixe o Foco com a sua cara.</h1><p>Personalize a aparência e gerencie sua assinatura em um só lugar.</p></section><section className="settings-card"><div><p className="eyebrow">Aparência</p><h2>Plano de fundo</h2></div><div className="theme-options">{themes.map(([value, title, description]) => <button key={value} className={theme === value ? `theme-option ${value} selected` : `theme-option ${value}`} onClick={() => select(value)}><span /><strong>{title}</strong><small>{description}</small></button>)}</div></section><section className="settings-card billing-card"><div><p className="eyebrow">Assinatura</p><h2>{isPaid ? planNames[subscription.plan] ?? subscription.plan : 'Plano gratuito'}</h2></div><div className="billing-summary"><strong>{isPaid ? `Cobrança ${subscription.billing_interval === 'year' ? 'anual' : 'mensal'}` : 'Você pode usar o essencial sem pagar.'}</strong>{isPaid && subscription.current_period_end && <p>{subscription.cancel_at_period_end ? 'Acesso disponível' : 'Próxima renovação'} até {new Intl.DateTimeFormat('pt-BR').format(new Date(subscription.current_period_end))}.</p>}</div>{isPaid ? <form action={openBillingPortal}><button className="button button-outline">Gerenciar cobrança</button></form> : <a className="button button-outline" href="/planos">Conhecer os planos</a>}</section></>
}
