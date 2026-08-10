import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Planos | Foco',
  description: 'Escolha o ritmo que faz sentido para você.',
}

const freeFeatures = ['Tarefas sem limite', 'Prioridades e progresso do dia', 'Sequência de dias ativos', 'Um espaço simples para manter o ritmo']
const proFeatures = ['Tudo do plano gratuito', 'Categorias e visões por projeto', 'Histórico de progresso e exportação', 'Lembretes para não perder o ritmo', 'Novas ferramentas de foco primeiro']

export default function PlanosPage() {
  return (
    <main className="plans-shell">
      <nav className="marketing-nav" aria-label="Navegação principal">
        <a className="brand" href="/"><span className="brand-mark">F</span><span>foco</span></a>
        <div><a href="/entrar">Entrar</a><a className="nav-cta" href="/cadastro">Começar grátis</a></div>
      </nav>
      <section className="plans-hero">
        <p className="eyebrow">Planos feitos para durar</p>
        <h1>Menos ruído.<br />Mais ritmo.</h1>
        <p>Comece pelo essencial. Quando precisar de mais profundidade, o Foco acompanha você.</p>
      </section>
      <section className="plan-grid" aria-label="Planos disponíveis">
        <article className="plan-card">
          <div className="plan-heading"><div><p className="eyebrow">Para começar</p><h2>Gratuito</h2></div><span className="plan-price">R$ 0 <small>para sempre</small></span></div>
          <p className="plan-intro">Tudo o que você precisa para transformar intenção em pequenos avanços diários.</p>
          <ul>{freeFeatures.map((feature) => <li key={feature}><span>✓</span>{feature}</li>)}</ul>
          <a className="button button-outline" href="/cadastro">Criar conta grátis</a>
        </article>
        <article className="plan-card plan-card-pro">
          <div className="plan-badge">Em breve</div>
          <div className="plan-heading"><div><p className="eyebrow">Para aprofundar</p><h2>Foco Pro</h2></div><span className="plan-price">R$ 14,90 <small>/ mês</small></span></div>
          <p className="plan-intro">Para quem quer enxergar padrões, proteger o próprio tempo e construir constância.</p>
          <ul>{proFeatures.map((feature) => <li key={feature}><span>✓</span>{feature}</li>)}</ul>
          <a className="button button-light" href="/cadastro">Entrar na lista de interesse</a>
        </article>
      </section>
      <section className="plans-note"><span aria-hidden="true">✦</span><p>O plano gratuito sempre vai existir. O Pro será uma forma de apoiar o Foco e acessar ferramentas mais profundas quando elas fizerem sentido.</p></section>
      <footer className="marketing-footer">Foco é sobre voltar ao que importa, quantas vezes for preciso.</footer>
    </main>
  )
}
