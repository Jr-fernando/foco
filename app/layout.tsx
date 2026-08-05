import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Foco — um passo por vez',
  description: 'Gerenciador de tarefas com ritmo, sem cobrança.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
