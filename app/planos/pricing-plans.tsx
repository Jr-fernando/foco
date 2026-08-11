'use client'

import { useState } from 'react'
import { createCheckout } from '../actions/billing'
import type { BillingInterval, PlanId } from '@/lib/stripe'
import { PlanBadge } from '../components/plan-badge'

const plans: Array<{
  id: PlanId
  name: string
  eyebrow: string
  monthly: number
  yearly: number
  description: string
  features: Array<{ label: string; tier: 'essential' | 'pro' }>
  featured?: boolean
}> = [
  { id: 'essential', name: 'Foco Essencial', eyebrow: 'Para criar consistência', monthly: 19.9, yearly: 199, description: 'Para organizar a rotina, repetir o que funciona e enxergar sua evolução.', features: [{ label: 'Rotinas e check-in diário', tier: 'essential' }, { label: 'Histórico e insights completos', tier: 'essential' }, { label: 'Temas premium e exportação', tier: 'essential' }] },
  { id: 'pro', name: 'Foco Pro', eyebrow: 'Para projetos e metas', monthly: 34.9, yearly: 349, description: 'Uma central de clareza para projetos, objetivos e semanas mais exigentes.', features: [{ label: 'Tudo do plano Essencial', tier: 'essential' }, { label: 'Projetos, etapas e áreas', tier: 'pro' }, { label: 'Planejamento mensal e revisões', tier: 'pro' }, { label: 'Suporte prioritário e novidades', tier: 'pro' }], featured: true },
]

const comparison = [
  { feature: 'Tarefas, calendário semanal e timer', free: true, essential: true, pro: true, tier: 'free' as const },
  { feature: 'Rotinas e acompanhamento diário', free: false, essential: true, pro: true, tier: 'essential' as const },
  { feature: 'Insights avançados e temas premium', free: false, essential: true, pro: true, tier: 'essential' as const },
  { feature: 'Projetos e visão de longo prazo', free: false, essential: false, pro: true, tier: 'pro' as const },
  { feature: 'Revisões e suporte prioritário', free: false, essential: false, pro: true, tier: 'pro' as const },
]

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function PricingPlans({ billingReady }: { billingReady: boolean }) {
  const [cycle, setCycle] = useState<BillingInterval>('month')
  return <>
    <div className="billing-toggle" role="group" aria-label="Frequência de cobrança"><button type="button" className={cycle === 'month' ? 'active' : ''} onClick={() => setCycle('month')}>Mensal</button><button type="button" className={cycle === 'year' ? 'active' : ''} onClick={() => setCycle('year')}>Anual <span>2 meses grátis</span></button></div>
    <section className="plan-grid" aria-label="Planos disponíveis">{plans.map((plan) => {
      const price = cycle === 'month' ? plan.monthly : plan.yearly
      const equivalent = plan.yearly / 12
      return <article key={plan.id} className={plan.featured ? 'plan-card plan-card-pro' : 'plan-card'}>
        {plan.featured && <div className="plan-badge">Mais completo</div>}
        <div className="plan-heading"><div><p className="eyebrow">{plan.eyebrow}</p><h2>{plan.name}</h2></div></div>
        <div className="price-line"><strong>{money.format(price)}</strong><span>{cycle === 'month' ? 'por mês' : 'por ano'}</span></div>
        {cycle === 'year' && <p className="price-equivalent">Equivale a {money.format(equivalent)} por mês</p>}
        <p className="plan-intro">{plan.description}</p>
        <ul>{plan.features.map((feature) => <li key={feature.label}><span>✓</span><span>{feature.label}</span><PlanBadge plan={feature.tier} compact /></li>)}</ul>
        {billingReady ? <form action={createCheckout.bind(null, plan.id, cycle)}><button className={plan.featured ? 'button button-light' : 'button button-outline'}>Assinar {plan.name.replace('Foco ', '')}</button></form> : <button className={plan.featured ? 'button button-light' : 'button button-outline'} disabled>Ativação em andamento</button>}
        <small className="renewal-note">Renovação automática. Cancele quando quiser.</small>
      </article>
    })}</section>
    <section className="plan-comparison" aria-labelledby="compare-title"><div className="comparison-heading"><p className="eyebrow">Compare com clareza</p><h2 id="compare-title">O plano certo para o seu momento</h2><p>Comece simples e evolua quando sua rotina pedir mais estrutura.</p></div><div className="comparison-table" role="table"><div className="comparison-row comparison-head" role="row"><strong>Recurso</strong><strong>Grátis</strong><strong>Essencial</strong><strong>Pro</strong></div>{comparison.map((row) => <div className="comparison-row" role="row" key={row.feature}><span><PlanBadge plan={row.tier} compact />{row.feature}</span><i aria-label={row.free ? 'Incluído' : 'Não incluído'}>{row.free ? '✓' : '—'}</i><i aria-label={row.essential ? 'Incluído' : 'Não incluído'}>{row.essential ? '✓' : '—'}</i><i aria-label={row.pro ? 'Incluído' : 'Não incluído'}>{row.pro ? '✓' : '—'}</i></div>)}</div></section>
  </>
}
