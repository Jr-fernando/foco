import { PlanBadge } from './plan-badge'
import Link from 'next/link'

const items = [
  { label: 'Home', href: '/painel', icon: '⌂' },
  { label: 'Planejar', href: '/planejar', icon: '▦' },
  { label: 'Foco', href: '/foco', icon: '◎' },
  { label: 'Rotinas', href: '/rotinas', icon: '↻', plan: 'essential' as const },
  { label: 'Projetos', href: '/projetos', icon: '◇', plan: 'pro' as const },
  { label: 'Insights', href: '/insights', icon: '↗' },
  { label: 'Ajustes', href: '/ajustes', icon: '⚙' },
]

export function AppNav({ active }: { active: string }) {
  return <nav className="app-nav" aria-label="Áreas do aplicativo">{items.map(({ label, href, icon, plan }) => <Link key={href} className={href === active ? 'active' : ''} href={href} prefetch><i aria-hidden="true">{icon}</i><span>{label}</span>{plan ? <PlanBadge plan={plan} compact /> : null}</Link>)}</nav>
}
