import { createBrowserClient } from '@supabase/ssr'

// Cliente para Client Components. Usa a anon key — segura para expor,
// já que toda a proteção real vem das políticas de RLS no banco.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
