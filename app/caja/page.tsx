'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Arqueo {
    fecha: string
    total_efectivo: number
    total_tarjeta: number
    total_transfer: number
    total_mp: number
    total_pedidosya: number
    total_dia: number
    notas: string
}

export default function Caja() {
    const [arqueo, setArqueo] = useState<Arqueo | null>(null)
    const [notas, setNotas] = useState('')
    const [loading, setLoading] = useState(true)
    const [guardando, setGuardando] = useState(false)
    const [exito, setExito] = useState(false)

    const hoy = new Date().toISOString().split('T')[0]

    const cargar = async () => {
        // Traer arqueo existente
        const { data: arqueoExistente } = await supabase
            .from('arqueo_caja')
            .select('*')
            .eq('fecha', hoy)
            .single()

        // Traer totales desde ventas del día
        const { data: ventas } = await supabase
            .from('ventas')
            .select('medio_pago, total')
            .eq('fecha', hoy)

        const totales = {
            efectivo: 0,
            tarjeta: 0,
            transferencia: 0,
            mercadopago: 0,
            pedidosya: 0,
        }

        ventas?.forEach(v => {
            if (v.medio_pago === 'efectivo') totales.efectivo += v.total
            if (v.medio_pago === 'tarjeta') totales.tarjeta += v.total
            if (v.medio_pago === 'transferencia') totales.transferencia += v.total
            if (v.medio_pago === 'mercadopago') totales.mercadopago += v.total
            if (v.medio_pago === 'pedidosya') totales.pedidosya += v.total
        })

        const total_dia = Object.values(totales).reduce((a, b) => a + b, 0)

        setArqueo({
            fecha: hoy,
            total_efectivo: totales.efectivo,
            total_tarjeta: totales.tarjeta,
            total_transfer: totales.transferencia,
            total_mp: totales.mercadopago,
            total_pedidosya: totales.pedidosya,
            total_dia,
            notas: arqueoExistente?.notas || '',
        })
        setNotas(arqueoExistente?.notas || '')
        setLoading(false)
    }

    useEffect(() => { cargar() }, [])

    const guardar = async () => {
        if (!arqueo) return
        setGuardando(true)
        await supabase.from('arqueo_caja').upsert({
            fecha: hoy,
            total_efectivo: arqueo.total_efectivo,
            total_tarjeta: arqueo.total_tarjeta,
            total_transfer: arqueo.total_transfer,
            total_mp: arqueo.total_mp,
            total_pedidosya: arqueo.total_pedidosya,
            notas,
        }, { onConflict: 'fecha' })
        setExito(true)
        setTimeout(() => setExito(false), 3000)
        setGuardando(false)
    }

    const fmt = (n: number) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

    if (loading) return <p className="text-gray-400">Cargando...</p>

    const medios = [
        { label: 'Efectivo', value: arqueo?.total_efectivo || 0, color: 'text-yellow-400' },
        { label: 'Tarjeta', value: arqueo?.total_tarjeta || 0, color: 'text-blue-400' },
        { label: 'Transferencia', value: arqueo?.total_transfer || 0, color: 'text-purple-400' },
        { label: 'Mercado Pago', value: arqueo?.total_mp || 0, color: 'text-cyan-400' },
        { label: 'Pedidos Ya', value: arqueo?.total_pedidosya || 0, color: 'text-orange-400' },
    ]

    return (
        <div className="max-w-lg mx-auto space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-amber-400">Caja del día</h1>
                <span className="text-gray-500 text-sm">{hoy}</span>
            </div>

            {exito && (
                <div className="bg-green-900 border border-green-700 text-green-300 px-4 py-3 rounded-lg">
                    ✓ Arqueo guardado
                </div>
            )}

            {/* Total grande */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 text-center">
                <p className="text-gray-500 text-sm mb-1">Total del día</p>
                <p className="text-4xl font-semibold text-green-400">{fmt(arqueo?.total_dia || 0)}</p>
            </div>

            {/* Desglose por medio */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                {medios.map((m, i) => (
                    <div key={i} className="flex justify-between items-center px-4 py-3 border-b border-gray-800 last:border-0">
                        <span className="text-gray-400 text-sm">{m.label}</span>
                        <span className={`font-medium ${m.value > 0 ? m.color : 'text-gray-700'}`}>
                            {fmt(m.value)}
                        </span>
                    </div>
                ))}
            </div>

            {/* Notas */}
            <div>
                <label className="text-xs text-gray-500 mb-1 block">Notas del día</label>
                <textarea
                    value={notas}
                    onChange={e => setNotas(e.target.value)}
                    rows={3}
                    placeholder="Observaciones, gastos, novedades..."
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-none"
                />
            </div>

            <button
                onClick={guardar}
                disabled={guardando}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl transition-colors"
            >
                {guardando ? 'Guardando...' : 'Guardar arqueo'}
            </button>
        </div>
    )
}