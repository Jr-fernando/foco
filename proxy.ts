import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Roda em toda request. Responsabilidades:
// 1. Renovar a sessão do Supabase antes que o token expire
// 2. Bloquear acesso a rotas privadas sem sessão válida
// Isso é a segunda camada de defesa — a primeira é o RLS no banco.
export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const pathname = request.nextUrl.pathname
  const isLandingRoute = pathname === '/'
  const isSignInRoute = pathname.startsWith('/entrar') || pathname.startsWith('/cadastro')
  const isPublicRoute = isLandingRoute || isSignInRoute || pathname.startsWith('/planos') || pathname.startsWith('/recursos') || pathname.startsWith('/api/public') || pathname === '/api/webhooks/stripe'

  // Se as variáveis de ambiente não estiverem configuradas,
  // mantém as páginas públicas acessíveis e evita crash 500 no deploy.
  // Isso evita crash 500 (MIDDLEWARE_INVOCATION_FAILED) em deploy sem env vars.
  if (!supabaseUrl || !supabaseAnonKey) {
    if (isPublicRoute) return response

    return NextResponse.redirect(new URL('/entrar', request.url))
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !isPublicRoute) {
    const redirectUrl = new URL('/entrar', request.url)
    redirectUrl.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (user && isSignInRoute) {
    return NextResponse.redirect(new URL('/painel', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)',
  ],
}
