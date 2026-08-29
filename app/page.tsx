'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface ResumenDia {
  fecha: string
  cantidad_tickets: number
  total_dia: number
  efectivo: number
  tarjeta: number
  transferencia: number
  mercadopago: number
  pedidosya: number
}

export default function Dashboard() {
  const [hoy, setHoy] = useState<ResumenDia | null>(null)
  const [topProductos, setTopProductos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      const hoyStr = new Date().toISOString().split('T')[0]

      const { data: resumen } = await supabase
        .from('resumen_diario')
        .select('*')
        .eq('fecha', hoyStr)
        .single()

      const { data: top } = await supabase
        .from('top_productos')
        .select('*')
        .limit(5)

      setHoy(resumen)
      setTopProductos(top || [])
      setLoading(false)
    }
    cargar()
  }, [])

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

  if (loading) return <p className="text-gray-400">Cargando...</p>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-amber-400">Dashboard</h1>

      {/* KPIs del día */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total del día', value: fmt(hoy?.total_dia || 0), color: 'text-green-400' },
          { label: 'Tickets', value: hoy?.cantidad_tickets || 0, color: 'text-blue-400' },
          { label: 'Efectivo', value: fmt(hoy?.efectivo || 0), color: 'text-yellow-400' },
          { label: 'Digital', value: fmt((hoy?.tarjeta || 0) + (hoy?.transferencia || 0) + (hoy?.mercadopago || 0)), color: 'text-purple-400' },
        ].map((k) => (
          <div key={k.label} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-gray-500 mb-1">{k.label}</p>
            <p className={`text-xl font-semibold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Top productos */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
        <h2 className="text-sm font-medium text-gray-400 mb-3">Top productos (histórico)</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs border-b border-gray-800">
              <th className="text-left pb-2">Producto</th>
              <th className="text-right pb-2">Ingresos</th>
            </tr>
          </thead>
          <tbody>
            {topProductos.map((p, i) => (
              <tr key={i} className="border-b border-gray-800 last:border-0">
                <td className="py-2 text-gray-300">{p.nombre}</td>
                <td className="py-2 text-right text-green-400">{fmt(p.ingresos_totales)}</td>
              </tr>
            ))}
            {topProductos.length === 0 && (
              <tr><td colSpan={2} className="py-4 text-center text-gray-600">Sin ventas aún</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}