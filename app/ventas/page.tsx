'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTema } from '@/lib/theme'
import Link from 'next/link'

interface Venta {
    id: number
    fecha: string
    medio_pago: string
    total: number
    total_antes_descuento: number
    descuento: number
    anulada: boolean
    created_at: string
    venta_items: {
        id: number
        producto_id: number
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
    const { tema } = useTema()
    const [ventas, setVentas] = useState<Venta[]>([])
    const [loading, setLoading] = useState(true)
    const [expandida, setExpandida] = useState<number | null>(null)
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])

    const c = {
        card: tema === 'oscuro' ? '#0F0F18' : '#FFFFFF',
        card2: tema === 'oscuro' ? '#16161F' : '#F0EFE9',
        border: tema === 'oscuro' ? '#1E1E2E' : '#E5E4E0',
        text: tema === 'oscuro' ? '#F0EDE6' : '#1A1A1F',
        muted: tema === 'oscuro' ? '#3A3A4A' : '#9B9B9B',
        muted2: tema === 'oscuro' ? '#2A2A35' : '#C5C4C0',
    }

    const cargar = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('ventas')
            .select(`*, venta_items(id, producto_id, cantidad, gramos, subtotal, productos(nombre))`)
            .eq('fecha', fecha)
            .order('created_at', { ascending: false })
        setVentas(data || [])
        setLoading(false)
    }

    useEffect(() => { cargar() }, [fecha])

    const anular = async (id: number) => {
        if (!confirm('¿Anular esta venta? Se revertirá el stock.')) return
        const venta = ventas.find(v => v.id === id)
        if (!venta) return
        await supabase.from('ventas').update({
            anulada: true,
            anulada_at: new Date().toISOString(),
        }).eq('id', id)
        for (const item of venta.venta_items) {
            await supabase.rpc('decrementar_stock', {
                p_id: item.producto_id,
                p_cantidad: -(item.cantidad || 1),
            })
        }
        await cargar()
    }

    const fmt = (n: number) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

    const ventasActivas = ventas.filter(v => !v.anulada)
    const total = ventasActivas.reduce((a, v) => a + v.total, 0)

    const hora = (str: string) =>
        new Date(str).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

    return (
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: c.text, letterSpacing: '-0.03em' }}>Ventas</h1>
                    <p style={{ fontSize: '0.8rem', color: c.muted, marginTop: '0.2rem' }}>
                        {ventasActivas.length} ticket{ventasActivas.length !== 1 ? 's' : ''} · {fmt(total)}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <input
                        type="date"
                        value={fecha}
                        onChange={e => setFecha(e.target.value)}
                        style={{
                            background: c.card, border: `1px solid ${c.border}`,
                            borderRadius: '10px', padding: '0.5rem 0.875rem',
                            color: c.text, fontSize: '0.85rem', outline: 'none',
                        }}
                    />
                    <Link href="/ventas/nueva" style={{
                        background: '#F59E0B', color: '#0A0A0F',
                        padding: '0.5rem 1.1rem', borderRadius: '10px',
                        fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none',
                    }}>
                        + Nueva
                    </Link>
                </div>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {[
                    { label: 'Total del día', value: fmt(total), color: '#4ADE80', bg: '#4ADE8010', border: '#4ADE8025' },
                    { label: 'Tickets', value: ventasActivas.length, color: '#60A5FA', bg: '#60A5FA10', border: '#60A5FA25' },
                    { label: 'Anuladas', value: ventas.filter(v => v.anulada).length, color: '#F87171', bg: '#F8717110', border: '#F8717125' },
                ].map(k => (
                    <div key={k.label} style={{
                        background: k.bg, border: `1px solid ${k.border}`,
                        borderRadius: '16px', padding: '1.25rem 1.5rem',
                    }}>
                        <p style={{ fontSize: '0.72rem', color: c.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>{k.label}</p>
                        <p style={{ fontSize: '1.6rem', fontWeight: 700, color: k.color, letterSpacing: '-0.03em' }}>{k.value}</p>
                    </div>
                ))}
            </div>

            {loading && <p style={{ color: c.muted, fontSize: '0.85rem' }}>Cargando...</p>}

            {!loading && ventas.length === 0 && (
                <div style={{
                    background: c.card, border: `1px solid ${c.border}`,
                    borderRadius: '16px', padding: '3rem',
                    textAlign: 'center', color: c.muted2, fontSize: '0.875rem',
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
                            background: c.card,
                            border: `1px solid ${v.anulada ? '#F8717120' : c.border}`,
                            borderRadius: '14px', overflow: 'hidden',
                            opacity: v.anulada ? 0.5 : 1,
                        }}>
                            <button
                                onClick={() => setExpandida(expandida === v.id ? null : v.id)}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center',
                                    justifyContent: 'space-between', padding: '0.875rem 1.25rem',
                                    background: 'transparent', border: 'none', cursor: 'pointer', gap: '1rem',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = c.card2)}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ fontSize: '0.78rem', color: c.muted, fontVariantNumeric: 'tabular-nums' }}>
                                        {hora(v.created_at)}
                                    </span>
                                    <span style={{
                                        fontSize: '0.72rem', padding: '0.2rem 0.6rem',
                                        borderRadius: '6px', background: m.color + '20',
                                        color: m.color, fontWeight: 500,
                                    }}>
                                        {m.label}
                                    </span>
                                    {v.anulada && (
                                        <span style={{
                                            fontSize: '0.72rem', padding: '0.2rem 0.6rem',
                                            borderRadius: '6px', background: '#F8717120',
                                            color: '#F87171', fontWeight: 500,
                                        }}>
                                            anulada
                                        </span>
                                    )}
                                    {v.descuento > 0 && (
                                        <span style={{
                                            fontSize: '0.72rem', padding: '0.2rem 0.6rem',
                                            borderRadius: '6px', background: '#A78BFA20',
                                            color: '#A78BFA', fontWeight: 500,
                                        }}>
                                            desc.
                                        </span>
                                    )}
                                    <span style={{ fontSize: '0.78rem', color: c.muted2 }}>
                                        {v.venta_items.length} item{v.venta_items.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <span style={{ fontSize: '1rem', fontWeight: 700, color: v.anulada ? '#F87171' : '#4ADE80', letterSpacing: '-0.02em' }}>
                                    {fmt(v.total)}
                                </span>
                            </button>

                            {expandida === v.id && (
                                <div style={{ borderTop: `1px solid ${c.border}`, padding: '0.875rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {v.venta_items.map(item => (
                                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.85rem', color: c.muted }}>
                                                {item.productos?.nombre}
                                                {item.cantidad && item.cantidad > 1 && (
                                                    <span style={{ color: c.muted2, marginLeft: '0.375rem' }}>×{item.cantidad}</span>
                                                )}
                                                {item.gramos && (
                                                    <span style={{ color: c.muted2, marginLeft: '0.375rem' }}>{item.gramos}g</span>
                                                )}
                                            </span>
                                            <span style={{ fontSize: '0.85rem', color: '#F59E0B', fontWeight: 500 }}>{fmt(item.subtotal)}</span>
                                        </div>
                                    ))}

                                    {v.descuento > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: `1px solid ${c.border}` }}>
                                            <span style={{ fontSize: '0.85rem', color: '#A78BFA' }}>Descuento</span>
                                            <span style={{ fontSize: '0.85rem', color: '#A78BFA' }}>−{fmt(v.descuento)}</span>
                                        </div>
                                    )}

                                    {!v.anulada && (
                                        <button
                                            onClick={() => anular(v.id)}
                                            style={{
                                                marginTop: '0.5rem', padding: '0.5rem 1rem',
                                                background: 'transparent', border: '1px solid #F8717130',
                                                borderRadius: '8px', color: '#F87171',
                                                fontSize: '0.78rem', cursor: 'pointer', width: '100%',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#F8717110'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            Anular venta
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}