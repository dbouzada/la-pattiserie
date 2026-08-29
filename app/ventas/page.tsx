'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Venta {
    id: number
    fecha: string
    medio_pago: string
    total: number
    created_at: string
    venta_items: {
        id: number
        cantidad: number
        gramos: number
        subtotal: number
        productos: { nombre: string }
    }[]
}

const COLORES: Record<string, string> = {
    efectivo: 'text-yellow-400 bg-yellow-900/30',
    tarjeta: 'text-blue-400 bg-blue-900/30',
    transferencia: 'text-purple-400 bg-purple-900/30',
    mercadopago: 'text-cyan-400 bg-cyan-900/30',
    pedidosya: 'text-orange-400 bg-orange-900/30',
}

export default function Ventas() {
    const [ventas, setVentas] = useState<Venta[]>([])
    const [loading, setLoading] = useState(true)
    const [expandida, setExpandida] = useState<number | null>(null)
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])

    const cargar = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('ventas')
            .select(`
        *,
        venta_items (
          id, cantidad, gramos, subtotal,
          productos ( nombre )
        )
      `)
            .eq('fecha', fecha)
            .order('created_at', { ascending: false })
        setVentas(data || [])
        setLoading(false)
    }

    useEffect(() => { cargar() }, [fecha])

    const fmt = (n: number) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

    const total = ventas.reduce((a, v) => a + v.total, 0)

    const hora = (str: string) =>
        new Date(str).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h1 className="text-2xl font-semibold text-amber-400">Ventas</h1>
                <div className="flex items-center gap-3">
                    <input
                        type="date"
                        value={fecha}
                        onChange={e => setFecha(e.target.value)}
                        className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                    <Link
                        href="/ventas/nueva"
                        className="bg-amber-500 hover:bg-amber-400 text-black text-sm font-medium px-4 py-2 rounded-lg"
                    >
                        + Nueva venta
                    </Link>
                </div>
            </div>

            {/* Resumen del día */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                    <p className="text-xs text-gray-500 mb-1">Total del día</p>
                    <p className="text-xl font-semibold text-green-400">{fmt(total)}</p>
                </div>
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                    <p className="text-xs text-gray-500 mb-1">Tickets</p>
                    <p className="text-xl font-semibold text-blue-400">{ventas.length}</p>
                </div>
            </div>

            {loading && <p className="text-gray-400">Cargando...</p>}

            {!loading && ventas.length === 0 && (
                <div className="text-center py-12 text-gray-600">
                    Sin ventas para esta fecha
                </div>
            )}

            {/* Lista de ventas */}
            <div className="space-y-2">
                {ventas.map(v => (
                    <div key={v.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                        <button
                            onClick={() => setExpandida(expandida === v.id ? null : v.id)}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-gray-500 text-xs">{hora(v.created_at)}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${COLORES[v.medio_pago] || 'text-gray-400'}`}>
                                    {v.medio_pago}
                                </span>
                                <span className="text-gray-400 text-xs">
                                    {v.venta_items.length} item{v.venta_items.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <span className="text-green-400 font-medium">{fmt(v.total)}</span>
                        </button>

                        {expandida === v.id && (
                            <div className="border-t border-gray-800 px-4 py-3 space-y-1">
                                {v.venta_items.map(item => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <span className="text-gray-400">
                                            {item.productos?.nombre}
                                            {item.cantidad && item.cantidad > 1 && (
                                                <span className="text-gray-600 ml-1">×{item.cantidad}</span>
                                            )}
                                            {item.gramos && (
                                                <span className="text-gray-600 ml-1">{item.gramos}g</span>
                                            )}
                                        </span>
                                        <span className="text-amber-400">{fmt(item.subtotal)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}