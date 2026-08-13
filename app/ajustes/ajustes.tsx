'use client'

import { useEffect, useState } from 'react'
import { openBillingPortal } from '../actions/billing'
import { PlanBadge } from '../components/plan-badge'
import { InstallAppButton } from '../components/pwa-install'
import { hasPlan, type ProductPlan } from '@/lib/plans'

const themes = [
  { value: 'original', title: 'Clareza', description: 'O tom natural do Foco.', required: 'free' },
  { value: 'night', title: 'Noite calma', description: 'Menos brilho para focar à noite.', required: 'free' },
  { value: 'lavender', title: 'Lavanda', description: 'Um espaço suave e contemplativo.', required: 'free' },
  { value: 'dune', title: 'Duna', description: 'Calor e conforto para planejar.', required: 'essential' },
  { value: 'aurora', title: 'Aurora', description: 'Profundidade e energia criativa.', required: 'pro' },
] as const satisfies ReadonlyArray<{ value: string; title: string; description: string; required: ProductPlan }>

type Subscription = { plan: string; status: string; billing_interval: string | null; current_period_end: string | null; cancel_at_period_end: boolean } | null
const planNames: Record<string, string> = { free: 'Gratuito', essential: 'Foco Essencial', pro: 'Foco Pro' }

export function Ajustes({ subscription, plan }: { subscription: Subscription; plan: ProductPlan }) {
  const [theme, setTheme] = useState('original')
  useEffect(() => { const saved = localStorage.getItem('foco-theme') ?? 'original'; const available = themes.find((item) => item.value === saved); const allowed = available && hasPlan(plan, available.required); const next = allowed ? saved : 'original'; const frame = requestAnimationFrame(() => setTheme(next)); return () => cancelAnimationFrame(frame) }, [plan])
  useEffect(() => { localStorage.setItem('foco-theme', theme); document.documentElement.dataset.theme = theme }, [theme])
  const isPaid = subscription && ['active', 'trialing', 'past_due'].includes(subscription.status)

  return <>
    <section className="secondary-hero"><p className="eyebrow">Seu espaço</p><h1>Deixe o Foco com a sua cara.</h1><p>Escolha o ambiente que combina com seu momento e gerencie sua assinatura em um só lugar.</p></section>
    <section className="settings-card install-settings"><div><p className="eyebrow">Aplicativo</p><h2>Foco na sua tela inicial</h2></div><div><strong>Abra em uma janela própria e acesse mais rápido.</strong><p>Funciona no computador, Android, iPhone e iPad. Suas tarefas continuam sincronizadas com sua conta.</p></div><InstallAppButton /></section>
    <section className="settings-card appearance-card"><div><p className="eyebrow">Aparência</p><h2>Cenários de foco</h2><p>Cada cenário ajusta cores, contraste e sensação do aplicativo inteiro.</p></div><div className="theme-options">{themes.map((item) => { const unlocked = hasPlan(plan, item.required); return <button key={item.value} className={`theme-option ${item.value}${theme === item.value ? ' selected' : ''}${unlocked ? '' : ' locked'}`} onClick={() => unlocked && setTheme(item.value)} aria-pressed={theme === item.value} aria-disabled={!unlocked}><span /><div><strong>{item.title}</strong><PlanBadge plan={item.required} compact /></div><small>{item.description}</small>{unlocked ? null : <em>Disponível no {item.required === 'pro' ? 'Pro' : 'Essencial'}</em>}</button> })}</div></section>
    <section className="settings-card billing-card"><div><p className="eyebrow">Assinatura</p><h2>{isPaid ? planNames[subscription.plan] ?? subscription.plan : 'Plano gratuito'}</h2></div><div className="billing-summary"><strong>{isPaid ? `Cobrança ${subscription.billing_interval === 'year' ? 'anual' : 'mensal'}` : 'Você pode usar o essencial sem pagar.'}</strong>{isPaid && subscription.current_period_end ? <p>{subscription.cancel_at_period_end ? 'Acesso disponível' : 'Próxima renovação'} até {new Intl.DateTimeFormat('pt-BR').format(new Date(subscription.current_period_end))}.</p> : null}</div>{isPaid ? <form action={openBillingPortal}><button className="button button-outline">Gerenciar cobrança</button></form> : <a className="button button-outline" href="/planos">Conhecer os planos</a>}</section>
  </>
}
