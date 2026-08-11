'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BillingInterval, getPriceId, getStripe, PlanId } from '@/lib/stripe'

const activeStatuses = new Set(['active', 'trialing', 'past_due'])

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'https://foco-six-sand.vercel.app'
}

export async function createCheckout(plan: PlanId, interval: BillingInterval) {
  if (!['essential', 'pro'].includes(plan) || !['month', 'year'].includes(interval)) redirect('/planos?aviso=Plano inválido.')
  const price = getPriceId(plan, interval)
  if (!price || !process.env.STRIPE_SECRET_KEY) redirect('/planos?aviso=Os pagamentos ainda não foram ativados.')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/entrar?next=${encodeURIComponent('/planos')}`)

  const { data: current } = await supabase.from('subscriptions').select('stripe_customer_id,status').eq('user_id', user.id).maybeSingle()
  const stripe = getStripe()

  if (current?.stripe_customer_id && activeStatuses.has(current.status)) {
    const portal = await stripe.billingPortal.sessions.create({ customer: current.stripe_customer_id, return_url: `${appUrl()}/ajustes` })
    redirect(portal.url)
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price, quantity: 1 }],
    success_url: `${appUrl()}/ajustes?checkout=sucesso`,
    cancel_url: `${appUrl()}/planos?aviso=Pagamento cancelado. Nenhuma cobrança foi feita.`,
    client_reference_id: user.id,
    customer: current?.stripe_customer_id ?? undefined,
    customer_email: current?.stripe_customer_id ? undefined : user.email,
    allow_promotion_codes: true,
    metadata: { user_id: user.id, plan, interval },
    subscription_data: { metadata: { user_id: user.id, plan, interval } },
    integration_identifier: 'foco_web_a8k2m4qz',
  })

  if (!session.url) redirect('/planos?aviso=Não foi possível abrir o pagamento.')
  redirect(session.url)
}

export async function openBillingPortal() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')
  const { data } = await supabase.from('subscriptions').select('stripe_customer_id').eq('user_id', user.id).maybeSingle()
  if (!data?.stripe_customer_id || !process.env.STRIPE_SECRET_KEY) redirect('/planos?aviso=Você ainda não possui uma assinatura ativa.')
  const session = await getStripe().billingPortal.sessions.create({ customer: data.stripe_customer_id, return_url: `${appUrl()}/ajustes` })
  redirect(session.url)
}
