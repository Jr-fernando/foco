import type { Metadata } from 'next'
import './globals.css'
import './product.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://foco-six-sand.vercel.app'),
  title: 'Foco — um passo por vez',
  description: 'Menos ruído. Mais ritmo. Organize o que importa sem se sobrecarregar.',
  openGraph: {
    title: 'Foco — Menos ruído. Mais ritmo.',
    description: 'Organize o que importa sem se sobrecarregar.',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Foco — Menos ruído. Mais ritmo.',
    description: 'Organize o que importa sem se sobrecarregar.',
    images: ['/og.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
