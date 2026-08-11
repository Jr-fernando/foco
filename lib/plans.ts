import type { SupabaseClient } from '@supabase/supabase-js'

export type ProductPlan = 'free' | 'essential' | 'pro'
export const planRank: Record<ProductPlan, number> = { free: 0, essential: 1, pro: 2 }

export function hasPlan(current: ProductPlan, required: ProductPlan) {
  return planRank[current] >= planRank[required]
}

export async function getUserPlan(supabase: SupabaseClient, userId: string): Promise<ProductPlan> {
  const { data } = await supabase.from('subscriptions').select('plan,status').eq('user_id', userId).maybeSingle()
  if (!data || !['active', 'trialing', 'past_due'].includes(data.status)) return 'free'
  return data.plan === 'pro' ? 'pro' : data.plan === 'essential' ? 'essential' : 'free'
}
