import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function signIn(formData: FormData) {
  'use server'
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect('/entrar?erro=' + encodeURIComponent('E-mail ou senha inválidos.'))
  }

  redirect('/')
}

export default async function EntrarPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const params = await searchParams
  return (
    <main style={{ maxWidth: 360, margin: '80px auto', padding: '0 20px' }}>
      <h1>Entrar no Foco</h1>
      {params.erro && <p role="alert">{params.erro}</p>}
      <form action={signIn}>
        <label>
          E-mail
          <input type="email" name="email" required autoComplete="email" />
        </label>
        <label>
          Senha
          <input type="password" name="password" required autoComplete="current-password" />
        </label>
        <button type="submit">Entrar</button>
      </form>
      <p>
        Ainda não tem conta? <a href="/cadastro">Criar conta</a>
      </p>
    </main>
  )
}
