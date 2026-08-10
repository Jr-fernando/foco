'use client'

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="error-screen">
      <section>
        <a className="brand" href="/"><span className="brand-mark">F</span><span>foco</span></a>
        <p className="eyebrow">Uma pausa inesperada</p>
        <h1>Não conseguimos abrir esta parte agora.</h1>
        <p>Seu espaço continua seguro. Tente novamente em alguns instantes.</p>
        <button className="button button-primary" onClick={reset}>Tentar novamente</button>
      </section>
    </main>
  )
}
