import type { ProductPlan } from '@/lib/plans'

const labels: Record<ProductPlan, string> = { free: 'Grátis', essential: 'Essencial', pro: 'Pro' }

export function PlanBadge({ plan, compact = false }: { plan: ProductPlan; compact?: boolean }) {
  return <span className={`tier-badge tier-${plan}${compact ? ' compact' : ''}`}>{labels[plan]}</span>
}
