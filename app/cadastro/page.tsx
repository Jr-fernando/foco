import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function signUp(formData: FormData) {
  'use server'
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const displayName = String(formData.get('displayName') ?? '')

  if (password.length < 8) {
    redirect('/cadastro?erro=' + encodeURIComponent('A senha precisa de pelo menos 8 caracteres.'))
  }

  const supabase = createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  })

  if (error) {
    redirect('/cadastro?erro=' + encodeURIComponent('Não foi possível criar a conta. ' + error.message))
  }

  redirect('/entrar?criado=1')
}

export default async function CadastroPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const params = await searchParams
  return (
    <main style={{ maxWidth: 360, margin: '80px auto', padding: '0 20px' }}>
      <h1>Criar conta no Foco</h1>
      {params.erro && <p role="alert">{params.erro}</p>}
      <form action={signUp}>
        <label>
          Nome
          <input type="text" name="displayName" required autoComplete="name" />
        </label>
        <label>
          E-mail
          <input type="email" name="email" required autoComplete="email" />
        </label>
        <label>
          Senha
          <input type="password" name="password" required minLength={8} autoComplete="new-password" />
        </label>
        <button type="submit">Criar conta</button>
      </form>
      <p>
        Já tem conta? <a href="/entrar">Entrar</a>
      </p>
    </main>
  )
}
