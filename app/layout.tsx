import type { Metadata, Viewport } from 'next'
import { DM_Mono, DM_Sans, Fraunces } from 'next/font/google'
import './globals.css'
import './product.css'
import './refinement.css'
import { PwaInstall } from './components/pwa-install'

const sans = DM_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const display = Fraunces({ subsets: ['latin'], variable: '--font-display', display: 'swap' })
const mono = DM_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL('https://foco-six-sand.vercel.app'),
  title: 'Foco — um passo por vez',
  description: 'Menos ruído. Mais ritmo. Organize o que importa sem se sobrecarregar.',
  applicationName: 'Foco',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Foco' },
  formatDetection: { telephone: false },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/apple-touch-icon.png' },
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

export const viewport: Viewport = {
  themeColor: '#176f55',
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body>{children}<PwaInstall /></body>
    </html>
  )
}
