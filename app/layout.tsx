import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'La Pattiserie',
  description: 'Sistema de gestión',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${geist.className} bg-gray-950 text-white min-h-screen`}>
        <nav className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex gap-6 items-center">
          <span className="font-semibold text-amber-400 text-lg">🥐 La Pattiserie</span>
          <Link href="/" className="text-sm text-gray-300 hover:text-white">Dashboard</Link>
          <Link href="/ventas/nueva" className="text-sm text-gray-300 hover:text-white">Nueva venta</Link>
          <Link href="/ventas" className="text-sm text-gray-300 hover:text-white">Ventas</Link>
          <Link href="/productos" className="text-sm text-gray-300 hover:text-white">Productos</Link>
          <Link href="/stock" className="text-sm text-gray-300 hover:text-white">Stock</Link>
          <Link href="/caja" className="text-sm text-gray-300 hover:text-white">Caja</Link>
        </nav>
        <main className="p-6">{children}</main>
      </body>
    </html>
  )
}