import type { Metadata } from 'next'
import { DM_Mono, DM_Sans, Fraunces } from 'next/font/google'
import './globals.css'
import './product.css'
import './refinement.css'

const sans = DM_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const display = Fraunces({ subsets: ['latin'], variable: '--font-display', display: 'swap' })
const mono = DM_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' })

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
    <html lang="pt-BR" className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
