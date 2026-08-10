const benefits = [
  ['Escolha o essencial', 'Transforme o ruído em uma lista curta e possível para hoje.'],
  ['Veja o progresso', 'Acompanhe o que avançou sem transformar produtividade em pressão.'],
  ['Construa constância', 'Um ritmo gentil, com espaço para recomeçar todos os dias.'],
]

export default function HomePage() {
  return (
    <main className="landing-shell">
      <nav className="marketing-nav" aria-label="Navegação principal">
        <a className="brand" href="/" aria-label="Foco, início">
          <span className="brand-mark">F</span>
          <span>foco</span>
        </a>
        <div className="marketing-links">
          <a href="#como-funciona">Como funciona</a>
          <a href="/planos">Planos</a>
          <a className="nav-signin" href="/entrar">Entrar</a>
          <a className="button button-primary nav-cta" href="/cadastro">Começar grátis</a>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="landing-copy">
          <p className="eyebrow">Clareza para a vida que já está acontecendo</p>
          <h1>Menos pressão.<br />Mais presença.</h1>
          <p>O Foco é um lugar simples para decidir o que merece sua atenção — e deixar o resto esperar.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="/cadastro">Criar minha conta grátis <span aria-hidden="true">→</span></a>
            <a className="text-link" href="#como-funciona">Conhecer o Foco</a>
          </div>
          <small>Sem cartão. Comece no seu ritmo.</small>
        </div>
        <aside className="landing-preview" aria-label="Exemplo de uma lista de foco">
          <div className="preview-topline"><span>Hoje, com calma</span><span>2 de 3</span></div>
          <div className="preview-progress"><span /></div>
          <div className="preview-task done"><i>✓</i><span>Responder o que é importante</span></div>
          <div className="preview-task"><i /><span>Separar 30 minutos para mim</span><em>Pessoal</em></div>
          <div className="preview-task"><i /><span>Dar o primeiro passo no projeto</span><em>Trabalho</em></div>
          <p>“Você não precisa fazer tudo para fazer progresso.”</p>
        </aside>
      </section>

      <section className="benefit-section" id="como-funciona">
        <div className="section-intro">
          <p className="eyebrow">Feito para dias reais</p>
          <h2>Uma forma mais humana de se organizar.</h2>
        </div>
        <div className="benefit-grid">
          {benefits.map(([title, description], index) => (
            <article key={title} className="benefit-card">
              <span>0{index + 1}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-quote">
        <p>“Produtividade não é ter mais coisas abertas. É poder fechar o dia sabendo o que importou.”</p>
      </section>

      <section className="journey-section">
        <div>
          <p className="eyebrow">Seu ponto de partida</p>
          <h2>Da lista cheia<br />para um próximo passo.</h2>
        </div>
        <ol>
          <li><span>1</span><div><strong>Registre</strong><p>Anote o que está ocupando sua cabeça.</p></div></li>
          <li><span>2</span><div><strong>Priorize</strong><p>Escolha uma tarefa e dê a ela um lugar no dia.</p></div></li>
          <li><span>3</span><div><strong>Continue</strong><p>Veja seu progresso e volte amanhã sem culpa.</p></div></li>
        </ol>
      </section>

      <section className="landing-plans">
        <div>
          <p className="eyebrow">Comece livre</p>
          <h2>O básico para criar seu ritmo já está disponível.</h2>
          <a className="text-link" href="/planos">Conhecer planos e próximos recursos</a>
        </div>
        <article>
          <span className="plan-badge">Grátis para começar</span>
          <strong>R$ 0</strong>
          <p>Tarefas, prioridades, categorias e acompanhamento do seu ritmo.</p>
          <a className="button button-secondary" href="/cadastro">Criar conta grátis</a>
        </article>
      </section>

      <section className="landing-final">
        <p className="eyebrow">Seu tempo merece intenção</p>
        <h2>Comece com uma coisa que importa.</h2>
        <a className="button button-primary" href="/cadastro">Entrar no Foco <span aria-hidden="true">→</span></a>
      </section>

      <footer className="marketing-footer">
        <a className="brand" href="/"><span className="brand-mark">F</span><span>foco</span></a>
        <span>Feito para uma rotina mais leve.</span>
        <a href="/entrar">Já tenho conta</a>
      </footer>
    </main>
  )
}
