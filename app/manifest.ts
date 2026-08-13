import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Foco — Planejador de tarefas',
    short_name: 'Foco',
    description: 'Planeje tarefas, proteja sua atenção e avance no seu ritmo.',
    start_url: '/painel',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#f5f5ef',
    theme_color: '#176f55',
    categories: ['productivity', 'lifestyle'],
    lang: 'pt-BR',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Meu dia', short_name: 'Hoje', url: '/painel', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Planejar semana', short_name: 'Planejar', url: '/planejar', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Iniciar foco', short_name: 'Foco', url: '/foco', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ],
  }
}
