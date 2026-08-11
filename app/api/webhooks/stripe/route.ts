import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'

export const runtime = 'nodejs'

function idOf(value: string | { id: string } | null | undefined) {
  return typeof value === 'string' ? value : value?.id ?? null
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.user_id
  if (!userId) return
  const item = subscription.items.data[0]
  const periodEnd = item?.current_period_end
  const { error } = await createAdminClient().from('subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: idOf(subscription.customer),
    stripe_subscription_id: subscription.id,
    plan: subscription.metadata.plan === 'pro' ? 'pro' : 'essential',
    billing_interval: item?.price.recurring?.interval === 'year' ? 'year' : 'month',
    status: subscription.status,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
  }, { onConflict: 'user_id' })
  if (error) throw error
}

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!signature || !secret) return NextResponse.json({ error: 'Webhook não configurado' }, { status: 503 })

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret)
  } catch {
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 })
  }

  try {
    const admin = createAdminClient()
    const { error: eventError } = await admin.from('stripe_webhook_events').insert({ event_id: event.id, event_type: event.type })
    if (eventError?.code === '23505') return NextResponse.json({ received: true, duplicate: true })
    if (eventError) throw eventError

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        if (session.subscription) await syncSubscription(await getStripe().subscriptions.retrieve(idOf(session.subscription)!))
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await syncSubscription(event.data.object)
        break
    }
  } catch {
    await createAdminClient().from('stripe_webhook_events').delete().eq('event_id', event.id)
    return NextResponse.json({ error: 'Falha ao sincronizar assinatura' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
