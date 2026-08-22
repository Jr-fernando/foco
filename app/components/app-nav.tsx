'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PlanBadge } from './plan-badge'

const primary = [
  { label: 'Home', href: '/painel', icon: '⌂', description: 'Visão do dia' },
  { label: 'Planejar', href: '/planejar', icon: '▦', description: 'Semana e agenda' },
  { label: 'Foco', href: '/foco', icon: '◎', description: 'Timer e intenção' },
]

const organize = [
  { label: 'Rotinas', href: '/rotinas', icon: '↻', description: 'Hábitos recorrentes', plan: 'essential' as const },
  { label: 'Projetos', href: '/projetos', icon: '◇', description: 'Metas em etapas', plan: 'pro' as const },
  { label: 'Insights', href: '/insights', icon: '↗', description: 'Seu progresso' },
]

const settings = { label: 'Ajustes', href: '/ajustes', icon: '⚙', description: 'Conta e aparência' }
type NavItem = typeof primary[number] & { plan?: 'essential' | 'pro' }

function NavLink({ item, active, onNavigate }: { item: NavItem; active: string; onNavigate?: () => void }) {
  return <Link className={item.href === active ? 'active' : ''} href={item.href} prefetch onClick={onNavigate}><i aria-hidden="true">{item.icon}</i><span><strong>{item.label}</strong><small>{item.description}</small></span>{item.plan ? <PlanBadge plan={item.plan} compact /> : null}</Link>
}

export function AppNav({ active, onCapture }: { active: string; onCapture?: () => void }) {
  const [moreOpen, setMoreOpen] = useState(false)
  const router = useRouter()
  const capture = () => onCapture ? onCapture() : router.push('/painel?capture=1')

  return <>
    <aside className="desktop-app-rail" aria-label="Navegação principal">
      <Link className="rail-brand" href="/painel"><span>F</span><strong>foco</strong></Link>
      <button type="button" className="rail-capture" onClick={capture}><i aria-hidden="true">＋</i><span>Adicionar</span><kbd>Q</kbd></button>
      <nav className="rail-nav">
        <p>Seu espaço</p>{primary.map((item) => <NavLink key={item.href} item={item} active={active} />)}
        <p>Organizar</p>{organize.map((item) => <NavLink key={item.href} item={item} active={active} />)}
      </nav>
      <div className="rail-footer"><NavLink item={settings} active={active} /><Link className="rail-upgrade" href="/planos"><span>✦</span><div><strong>Conheça o Pro</strong><small>Mais clareza para crescer</small></div></Link></div>
    </aside>
    <nav className="mobile-app-nav" aria-label="Navegação principal">
      <NavLink item={primary[0]} active={active} /><NavLink item={primary[1]} active={active} />
      <button type="button" className="mobile-create" onClick={capture} aria-label="Adicionar tarefa ou ideia"><i aria-hidden="true">＋</i><span>Adicionar</span></button>
      <NavLink item={primary[2]} active={active} />
      <button type="button" className={moreOpen ? 'mobile-more active' : 'mobile-more'} onClick={() => setMoreOpen((value) => !value)} aria-expanded={moreOpen}><i aria-hidden="true">•••</i><span>Mais</span></button>
    </nav>
    {moreOpen ? <div className="mobile-more-layer" role="presentation" onClick={() => setMoreOpen(false)}><section className="mobile-more-sheet" role="dialog" aria-modal="true" aria-label="Mais áreas" onClick={(event) => event.stopPropagation()}><header><div><span>Seu Foco</span><strong>Mais áreas</strong></div><button type="button" onClick={() => setMoreOpen(false)} aria-label="Fechar">×</button></header><nav>{organize.map((item) => <NavLink key={item.href} item={item} active={active} onNavigate={() => setMoreOpen(false)} />)}<NavLink item={settings} active={active} onNavigate={() => setMoreOpen(false)} /><Link className="mobile-plan-link" href="/planos">Ver planos e recursos <span>→</span></Link></nav></section></div> : null}
  </>
}
