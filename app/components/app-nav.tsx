const items = [
  ['Hoje', '/painel'],
  ['Planejar', '/planejar'],
  ['Foco', '/foco'],
  ['Insights', '/insights'],
  ['Ajustes', '/ajustes'],
]

export function AppNav({ active }: { active: string }) {
  return <nav className="app-nav" aria-label="Áreas do aplicativo">{items.map(([label, href]) => <a key={href} className={href === active ? 'active' : ''} href={href}>{label}</a>)}</nav>
}
