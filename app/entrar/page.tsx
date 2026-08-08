import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

async function signIn(formData: FormData) {
  'use server'
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) redirect('/entrar?erro=' + encodeURIComponent('E-mail ou senha inválidos.'))
  redirect('/')
}

export default async function EntrarPage({ searchParams }: { searchParams: Promise<{ erro?: string; criado?: string }> }) {
  const params = await searchParams

  if (!isSupabaseConfigured()) {
    return (
      <main className="auth-shell">
        <section className="auth-card setup-card">
          <a className="brand" href="/"><span className="brand-mark">F</span><span>foco</span></a>
          <div className="setup-icon" aria-hidden="true">!</div>
          <h1>Quase pronto.</h1>
          <p>O Foco ainda precisa ser conectado ao Supabase. Adicione as chaves de ambiente do projeto para liberar o acesso com segurança.</p>
          <p className="auth-footer">Variáveis necessárias: <strong>NEXT_PUBLIC_SUPABASE_URL</strong> e <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY</strong>.</p>
        </section>
      </main>
    )
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <a className="brand" href="/"><span className="brand-mark">F</span><span>foco</span></a>
        <h1>Bem-vindo de volta.</h1>
        <p>Entre e escolha seu próximo passo com calma.</p>
        {params.criado && <p className="notice" role="status">Conta criada. Agora é só entrar.</p>}
        {params.erro && <p className="error-message" role="alert">{params.erro}</p>}
        <form action={signIn} className="auth-form">
          <label className="field">E-mail<input type="email" name="email" required autoComplete="email" /></label>
          <label className="field">Senha<input type="password" name="password" required autoComplete="current-password" /></label>
          <button className="button button-primary" type="submit">Entrar no Foco</button>
        </form>
        <p className="auth-footer">Ainda não tem conta? <a href="/cadastro">Criar conta</a></p>
      </section>
    </main>
  )
}
