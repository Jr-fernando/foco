import { createClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/plans'
import { AppNav } from '../components/app-nav'
import { Ajustes } from './ajustes'

export const dynamic = 'force-dynamic'

export default async function AjustesPage(props: { searchParams: Promise<{ checkout?: string }> }) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const [plan, { data: subscription }] = await Promise.all([
    getUserPlan(supabase, user.id),
    supabase.from('subscriptions').select('plan,status,billing_interval,current_period_end,cancel_at_period_end').eq('user_id', user.id).maybeSingle(),
  ])
  return <main className="app-shell"><section className="dashboard secondary-page"><header className="topbar"><a className="brand" href="/painel"><span className="brand-mark">F</span><span>foco</span></a><a className="account-link" href="/planos">Ver planos</a></header><AppNav active="/ajustes" />{searchParams.checkout === 'sucesso' ? <p className="notice">Pagamento concluído. Sua assinatura será atualizada em instantes.</p> : null}<Ajustes subscription={subscription} plan={plan} /></section></main>
}
