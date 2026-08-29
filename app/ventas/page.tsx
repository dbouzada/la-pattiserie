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

const MEDIOS: Record<string, { label: string; color: string }> = {
    efectivo: { label: 'Efectivo', color: '#FBBF24' },
    tarjeta: { label: 'Tarjeta', color: '#60A5FA' },
    transferencia: { label: 'Transferencia', color: '#A78BFA' },
    mercadopago: { label: 'Mercado Pago', color: '#34D399' },
    pedidosya: { label: 'Pedidos Ya', color: '#F87171' },
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
            .select(`*, venta_items(id, cantidad, gramos, subtotal, productos(nombre))`)
            .eq('fecha', fecha)
            .order('created_at', { ascending: false })
        setVentas(data || [])
        setLoading(false)
    }

    useEffect(() => { cargar() }, [fecha])

    const fmt = (n: number) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

    const total = ventas.reduce((a, v) => a + v.total, 0)

    const hora = (str: string) =>
        new Date(str).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

    return (
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F0EDE6', letterSpacing: '-0.03em' }}>Ventas</h1>
                    <p style={{ fontSize: '0.8rem', color: '#3A3A4A', marginTop: '0.2rem' }}>{ventas.length} ticket{ventas.length !== 1 ? 's' : ''} · {fmt(total)}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <input
                        type="date"
                        value={fecha}
                        onChange={e => setFecha(e.target.value)}
                        style={{
                            background: '#0F0F18',
                            border: '1px solid #1E1E2E',
                            borderRadius: '10px',
                            padding: '0.5rem 0.875rem',
                            color: '#E8E6E0',
                            fontSize: '0.85rem',
                            outline: 'none',
                        }}
                    />
                    <Link href="/ventas/nueva" style={{
                        background: '#F59E0B',
                        color: '#0A0A0F',
                        padding: '0.5rem 1.1rem',
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                    }}>
                        + Nueva
                    </Link>
                </div>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                {[
                    { label: 'Total del día', value: fmt(total), color: '#4ADE80', bg: '#4ADE8010', border: '#4ADE8025' },
                    { label: 'Tickets', value: ventas.length, color: '#60A5FA', bg: '#60A5FA10', border: '#60A5FA25' },
                ].map(k => (
                    <div key={k.label} style={{
                        background: k.bg,
                        border: `1px solid ${k.border}`,
                        borderRadius: '16px',
                        padding: '1.25rem 1.5rem',
                    }}>
                        <p style={{ fontSize: '0.72rem', color: '#3A3A4A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>{k.label}</p>
                        <p style={{ fontSize: '1.6rem', fontWeight: 700, color: k.color, letterSpacing: '-0.03em' }}>{k.value}</p>
                    </div>
                ))}
            </div>

            {loading && <p style={{ color: '#3A3A4A', fontSize: '0.85rem' }}>Cargando...</p>}

            {!loading && ventas.length === 0 && (
                <div style={{
                    background: '#0F0F18',
                    border: '1px solid #1E1E2E',
                    borderRadius: '16px',
                    padding: '3rem',
                    textAlign: 'center',
                    color: '#2A2A35',
                    fontSize: '0.875rem',
                }}>
                    Sin ventas para esta fecha
                </div>
            )}

            {/* Lista */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {ventas.map(v => {
                    const m = MEDIOS[v.medio_pago] || { label: v.medio_pago, color: '#6B6B80' }
                    return (
                        <div key={v.id} style={{
                            background: '#0F0F18',
                            border: '1px solid #1E1E2E',
                            borderRadius: '14px',
                            overflow: 'hidden',
                        }}>
                            <button
                                onClick={() => setExpandida(expandida === v.id ? null : v.id)}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0.875rem 1.25rem',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    gap: '1rem',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#16161F')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ fontSize: '0.78rem', color: '#3A3A4A', fontVariantNumeric: 'tabular-nums' }}>
                                        {hora(v.created_at)}
                                    </span>
                                    <span style={{
                                        fontSize: '0.72rem',
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '6px',
                                        background: m.color + '20',
                                        color: m.color,
                                        fontWeight: 500,
                                    }}>
                                        {m.label}
                                    </span>
                                    <span style={{ fontSize: '0.78rem', color: '#2A2A35' }}>
                                        {v.venta_items.length} item{v.venta_items.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#4ADE80', letterSpacing: '-0.02em' }}>
                                    {fmt(v.total)}
                                </span>
                            </button>

                            {expandida === v.id && (
                                <div style={{ borderTop: '1px solid #1E1E2E', padding: '0.875rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {v.venta_items.map(item => (
                                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.85rem', color: '#6B6B80' }}>
                                                {item.productos?.nombre}
                                                {item.cantidad && item.cantidad > 1 && (
                                                    <span style={{ color: '#2A2A35', marginLeft: '0.375rem' }}>×{item.cantidad}</span>
                                                )}
                                                {item.gramos && (
                                                    <span style={{ color: '#2A2A35', marginLeft: '0.375rem' }}>{item.gramos}g</span>
                                                )}
                                            </span>
                                            <span style={{ fontSize: '0.85rem', color: '#F59E0B', fontWeight: 500 }}>{fmt(item.subtotal)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}