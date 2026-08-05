import { createBrowserClient } from '@supabase/ssr'

// Cliente para Client Components. Usa a anon key — segura para expor,
// já que toda a proteção real vem das políticas de RLS no banco.
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY não configuradas.'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
