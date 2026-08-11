import Stripe from 'stripe'

let stripeClient: Stripe | null = null

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('Stripe não configurada')
  stripeClient ??= new Stripe(key, { typescript: true })
  return stripeClient
}

export type PlanId = 'essential' | 'pro'
export type BillingInterval = 'month' | 'year'

export function getPriceId(plan: PlanId, interval: BillingInterval) {
  const keys = {
    essential: { month: 'STRIPE_ESSENTIAL_MONTHLY_PRICE_ID', year: 'STRIPE_ESSENTIAL_YEARLY_PRICE_ID' },
    pro: { month: 'STRIPE_PRO_MONTHLY_PRICE_ID', year: 'STRIPE_PRO_YEARLY_PRICE_ID' },
  } as const
  return process.env[keys[plan][interval]]
}

export function billingIsConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET && process.env.SUPABASE_SERVICE_ROLE_KEY && getPriceId('essential', 'month') && getPriceId('essential', 'year') && getPriceId('pro', 'month') && getPriceId('pro', 'year'))
}
