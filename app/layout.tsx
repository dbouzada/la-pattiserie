import type { Metadata } from 'next'
import './globals.css'
import NavBar from '@/components/NavBar'
import { TemaProvider } from '@/lib/theme'

export const metadata: Metadata = {
  title: 'La Pattiserie',
  description: 'Sistema de gestión',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: 0 }}>
        <TemaProvider>
          <NavBar />
          {children}
        </TemaProvider>
      </body>
    </html>
  )
}

