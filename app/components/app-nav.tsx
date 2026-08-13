import { PlanBadge } from './plan-badge'
import Link from 'next/link'

const items = [
  { label: 'Hoje', href: '/painel' },
  { label: 'Planejar', href: '/planejar' },
  { label: 'Foco', href: '/foco' },
  { label: 'Rotinas', href: '/rotinas', plan: 'essential' as const },
  { label: 'Projetos', href: '/projetos', plan: 'pro' as const },
  { label: 'Insights', href: '/insights' },
  { label: 'Ajustes', href: '/ajustes' },
]

export function AppNav({ active }: { active: string }) {
  return <nav className="app-nav" aria-label="Áreas do aplicativo">{items.map(({ label, href, plan }) => <Link key={href} className={href === active ? 'active' : ''} href={href} prefetch><span>{label}</span>{plan ? <PlanBadge plan={plan} compact /> : null}</Link>)}</nav>
}
