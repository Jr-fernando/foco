'use client'

import { useState } from 'react'
import { createCheckout } from '../actions/billing'
import type { BillingInterval, PlanId } from '@/lib/stripe'

const plans: Array<{
  id: PlanId
  name: string
  eyebrow: string
  monthly: number
  yearly: number
  description: string
  features: string[]
  featured?: boolean
}> = [
  { id: 'essential', name: 'Foco Essencial', eyebrow: 'Para criar consistência', monthly: 19.9, yearly: 199, description: 'Para organizar a rotina, repetir o que funciona e enxergar sua evolução.', features: ['Tudo do plano gratuito', 'Rotinas e tarefas recorrentes', 'Histórico e insights completos', 'Temas premium e exportação'] },
  { id: 'pro', name: 'Foco Pro', eyebrow: 'Para projetos e metas', monthly: 34.9, yearly: 349, description: 'Uma central de clareza para projetos, objetivos e semanas mais exigentes.', features: ['Tudo do Essencial', 'Projetos, etapas e áreas', 'Planejamento mensal e revisões', 'Suporte prioritário e novidades'], featured: true },
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
        <ul>{plan.features.map((feature) => <li key={feature}><span>✓</span>{feature}</li>)}</ul>
        {billingReady ? <form action={createCheckout.bind(null, plan.id, cycle)}><button className={plan.featured ? 'button button-light' : 'button button-outline'}>Assinar {plan.name.replace('Foco ', '')}</button></form> : <button className={plan.featured ? 'button button-light' : 'button button-outline'} disabled>Ativação em andamento</button>}
        <small className="renewal-note">Renovação automática. Cancele quando quiser.</small>
      </article>
    })}</section>
  </>
}
