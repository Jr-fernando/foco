import type { Metadata } from 'next'
import { billingIsConfigured } from '@/lib/stripe'
import { PricingPlans } from './pricing-plans'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Planos | Foco', description: 'Escolha o ritmo que faz sentido para você.' }

export default async function PlanosPage(props: { searchParams: Promise<{ aviso?: string }> }) {
  const searchParams = await props.searchParams;
  return <main className="plans-shell">
    <nav className="marketing-nav" aria-label="Navegação principal"><a className="brand" href="/"><span className="brand-mark">F</span><span>foco</span></a><div><a href="/recursos">Recursos</a><a href="/entrar">Entrar</a><a className="nav-cta" href="/cadastro">Começar grátis</a></div></nav>
    <section className="plans-hero"><p className="eyebrow">Dois planos. Um ritmo mais claro.</p><h1>Escolha quanto apoio você quer.</h1><p>Comece gratuitamente e assine quando quiser mais profundidade. Você pode cancelar ou trocar de plano pelo portal da Stripe.</p></section>
    {searchParams.aviso && <p className="plans-alert" role="status">{searchParams.aviso}</p>}
    <PricingPlans billingReady={billingIsConfigured()} />
    <section className="free-plan-strip"><div><span>Plano gratuito</span><strong>Continue usando o básico sem pagar.</strong><p>Tarefas, prioridades, calendário semanal e cronômetro de foco.</p></div><a className="button button-outline" href="/cadastro">Começar grátis</a></section>
    {!billingIsConfigured() && <section className="billing-status"><strong>Ativação final dos pagamentos pendente</strong><p>A experiência de assinatura já está pronta, mas a conta comercial da Stripe ainda precisa fornecer as credenciais de produção. Enquanto isso, nenhuma cobrança real é iniciada.</p></section>}
    <section className="plans-note"><span aria-hidden="true">✦</span><p>Pagamento seguro pela Stripe. Assinaturas renovam automaticamente e podem ser gerenciadas a qualquer momento.</p></section>
    <footer className="marketing-footer">Foco é sobre voltar ao que importa, quantas vezes for preciso.</footer>
  </main>
}
