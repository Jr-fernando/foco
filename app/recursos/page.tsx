const areas = [
  ['Planeje sem lotar sua agenda', 'Organize as próximas tarefas por dia, defina uma estimativa e preserve espaço para o que muda.'],
  ['Entre em modo de foco', 'Use ciclos de foco e pausas para começar com menos resistência e terminar com mais presença.'],
  ['Entenda o seu ritmo', 'Acompanhe sua constância, tarefas concluídas e os pequenos avanços que criam uma rotina sustentável.'],
  ['Deixe com a sua cara', 'Escolha um tema que combine com seu momento e mantenha o espaço de trabalho agradável todos os dias.'],
]

export default function RecursosPage() {
  return (
    <main className="resource-shell">
      <nav className="marketing-nav" aria-label="Navegação principal">
        <a className="brand" href="/" aria-label="Foco, início"><span className="brand-mark">F</span><span>foco</span></a>
        <div className="marketing-links">
          <a href="/recursos">Recursos</a>
          <a href="/planos">Planos</a>
          <a className="nav-signin" href="/entrar">Entrar</a>
          <a className="button button-primary nav-cta" href="/cadastro">Começar grátis</a>
        </div>
      </nav>

      <section className="resource-hero">
        <p className="eyebrow">Um espaço para voltar ao essencial</p>
        <h1>Uma rotina mais clara começa com uma tela que não pesa.</h1>
        <p>O Foco reúne planejamento, concentração e acompanhamento em um só lugar — sem transformar o dia em uma corrida.</p>
        <a className="button button-primary" href="/cadastro">Criar minha conta grátis <span aria-hidden="true">→</span></a>
      </section>

      <section className="resource-grid" aria-label="Recursos do Foco">
        {areas.map(([title, description], index) => (
          <article key={title} className="resource-card">
            <span>0{index + 1}</span>
            <h2>{title}</h2>
            <p>{description}</p>
          </article>
        ))}
      </section>

      <section className="resource-cta">
        <div><p className="eyebrow">Comece no plano gratuito</p><h2>O primeiro passo pode ser pequeno.</h2></div>
        <a className="button button-secondary" href="/planos">Ver planos</a>
      </section>
    </main>
  )
}
