import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Planos | Foco',
  description: 'Escolha o ritmo que faz sentido para você.',
}

const plans = [
  { name: 'Gratuito', eyebrow: 'Para começar', price: 'R$ 0', suffix: 'para sempre', description: 'O essencial para decidir o que importa e voltar ao seu ritmo.', features: ['Tarefas, prioridades e categorias', 'Meu dia e planejamento semanal', 'Pomodoro e acompanhamento básico'], href: '/cadastro', action: 'Criar conta grátis' },
  { name: 'Foco Essencial', eyebrow: 'Para ganhar consistência', price: 'R$ 19,90', suffix: '/ mês', description: 'Para quem quer manter uma rotina mais previsível e enxergar a própria evolução.', features: ['Tudo do Gratuito', 'Insights avançados e histórico completo', 'Lembretes e rotinas recorrentes', 'Temas premium e exportação mensal'], href: process.env.STRIPE_ESSENTIAL_PAYMENT_LINK, action: 'Assinar Essencial', featured: true },
  { name: 'Foco Pro', eyebrow: 'Para aprofundar', price: 'R$ 34,90', suffix: '/ mês', description: 'Uma central de clareza para projetos, metas e semanas que realmente importam.', features: ['Tudo do Essencial', 'Projetos, etapas e visão por área', 'Planejamento mensal e revisões', 'Prioridade no suporte e novidades'], href: process.env.STRIPE_PRO_PAYMENT_LINK, action: 'Assinar Pro' },
]

export default function PlanosPage({ searchParams }: { searchParams: { aviso?: string } }) {
  const billingReady = Boolean(process.env.STRIPE_ESSENTIAL_PAYMENT_LINK && process.env.STRIPE_PRO_PAYMENT_LINK)
  return <main className="plans-shell"><nav className="marketing-nav" aria-label="Navegação principal"><a className="brand" href="/"><span className="brand-mark">F</span><span>foco</span></a><div><a href="/entrar">Entrar</a><a className="nav-cta" href="/cadastro">Começar grátis</a></div></nav><section className="plans-hero"><p className="eyebrow">Planos feitos para durar</p><h1>Menos ruído.<br />Mais ritmo.</h1><p>Comece pelo essencial. Quando precisar de mais profundidade, o Foco acompanha você.</p></section>{searchParams.aviso && <p className="plans-alert" role="status">{searchParams.aviso}</p>}<section className="plan-grid plan-grid-three" aria-label="Planos disponíveis">{plans.map((plan) => <article key={plan.name} className={plan.featured ? 'plan-card plan-card-pro' : 'plan-card'}>{plan.featured && <div className="plan-badge">Mais escolhido</div>}<div className="plan-heading"><div><p className="eyebrow">{plan.eyebrow}</p><h2>{plan.name}</h2></div><span className="plan-price">{plan.price} <small>{plan.suffix}</small></span></div><p className="plan-intro">{plan.description}</p><ul>{plan.features.map((feature) => <li key={feature}><span>✓</span>{feature}</li>)}</ul>{plan.href ? <a className={plan.featured ? 'button button-light' : 'button button-outline'} href={plan.href}>{plan.action}</a> : <a className="button button-outline" href="/cadastro">Criar conta e avisar interesse</a>}</article>)}</section>{!billingReady && <section className="billing-status"><strong>Assinaturas em preparação</strong><p>Os planos estão definidos, mas o checkout ainda não foi conectado a uma conta de pagamentos. Nenhuma cobrança será feita até essa conexão ser concluída.</p></section>}<section className="plans-note"><span aria-hidden="true">✦</span><p>Você pode começar gratuitamente e trocar de plano quando o seu ritmo pedir mais profundidade.</p></section><footer className="marketing-footer">Foco é sobre voltar ao que importa, quantas vezes for preciso.</footer></main>
}
