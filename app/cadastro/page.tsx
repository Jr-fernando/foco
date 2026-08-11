import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

function signupErrorMessage(message: string) {
  const wait = message.match(/after\s+(\d+)\s+seconds/i)

  if (wait) {
    return `Aguarde ${wait[1]} segundos antes de pedir outro e-mail de confirmação.`
  }

  if (/already registered/i.test(message)) {
    return 'Este e-mail já tem uma conta. Tente entrar ou aguarde o e-mail de confirmação.'
  }

  return 'Não foi possível criar sua conta agora. Confira os dados e tente novamente.'
}

async function signUp(formData: FormData) {
  'use server'
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const displayName = String(formData.get('displayName') ?? '')

  if (password.length < 8) redirect('/cadastro?erro=' + encodeURIComponent('A senha precisa de pelo menos 8 caracteres.'))

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  })

  if (error) redirect('/cadastro?erro=' + encodeURIComponent(signupErrorMessage(error.message)))
  redirect('/entrar?criado=1')
}

export default async function CadastroPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const params = await searchParams

  if (!isSupabaseConfigured()) {
    return (
      <main className="auth-shell">
        <section className="auth-card setup-card">
          <a className="brand" href="/"><span className="brand-mark">F</span><span>foco</span></a>
          <div className="setup-icon" aria-hidden="true">!</div>
          <h1>Cadastro indisponível.</h1>
          <p>Antes de criar contas, conecte este projeto ao Supabase pelas variáveis de ambiente da Vercel.</p>
          <p className="auth-footer"><a href="/entrar">Voltar</a></p>
        </section>
      </main>
    )
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <a className="brand" href="/"><span className="brand-mark">F</span><span>foco</span></a>
        <h1>Comece no seu ritmo.</h1>
        <p>Crie sua conta para organizar o que importa sem se sobrecarregar.</p>
        {params.erro && <p className="error-message" role="alert">{params.erro}</p>}
        <form action={signUp} className="auth-form">
          <label className="field">Nome<input type="text" name="displayName" required autoComplete="name" /></label>
          <label className="field">E-mail<input type="email" name="email" required autoComplete="email" /></label>
          <label className="field">Senha<input type="password" name="password" required minLength={8} autoComplete="new-password" /></label>
          <button className="button button-primary" type="submit">Criar minha conta</button>
        </form>
        <p className="auth-footer">Já tem conta? <a href="/entrar">Entrar</a></p>
        <aside className="auth-quote">
          <span aria-hidden="true">✦</span>
          <p>“Constância não é perfeição. É escolher recomeçar.”</p>
          <a href="/planos">Conheça os planos do Foco</a>
        </aside>
      </section>
    </main>
  )
}
