'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTema } from '@/lib/theme'
import Link from 'next/link'
import * as XLSX from 'xlsx'

interface Venta {
    id: number
    fecha: string
    medio_pago: string
    total: number
    total_antes_descuento: number
    descuento: number
    anulada: boolean
    created_at: string
    dni_cliente: string | null
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
    efectivo: { label: 'Efectivo', color: '#C9A96E' },
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
    const [fechaDesde, setFechaDesde] = useState(new Date().toISOString().split('T')[0])
    const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split('T')[0])

    const c = {
        card: tema === 'oscuro' ? '#162210' : '#F7F3EC',
        card2: tema === 'oscuro' ? '#1E2E14' : '#EDE8DF',
        border: tema === 'oscuro' ? '#2A4A1A' : '#C8BFA8',
        text: tema === 'oscuro' ? '#E8E4D8' : '#1A1A14',
        muted: tema === 'oscuro' ? '#8BAA6E' : '#6B6550',
        muted2: tema === 'oscuro' ? '#4A6A3A' : '#9B9280',
    }

    const cargar = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('ventas')
            .select(`*, venta_items(id, producto_id, cantidad, gramos, subtotal, productos(nombre))`)
            .gte('fecha', fechaDesde)
            .lte('fecha', fechaHasta)
            .order('created_at', { ascending: false })
        setVentas(data || [])
        setLoading(false)
    }

    useEffect(() => { cargar() }, [fechaDesde, fechaHasta])

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

    const exportarExcel = () => {
        const filas: any[] = []

        ventas.filter(v => !v.anulada).forEach(v => {
            v.venta_items.forEach(item => {
                filas.push({
                    'Fecha': v.fecha,
                    'Hora': new Date(v.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
                    'ID Venta': v.id,
                    'Tipo de venta': MEDIOS[v.medio_pago]?.label || v.medio_pago,
                    'DNI / CUIT': v.dni_cliente || '',
                    'Producto': item.productos?.nombre || '',
                    'Cantidad': item.cantidad || '',
                    'Gramos': item.gramos || '',
                    'Subtotal': item.subtotal,
                    'Descuento': v.descuento > 0 ? v.descuento : '',
                    'Total venta': v.total,
                })
            })
        })

        const ws = XLSX.utils.json_to_sheet(filas)

        // Ancho de columnas
        ws['!cols'] = [
            { wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 16 },
            { wch: 14 }, { wch: 35 }, { wch: 10 }, { wch: 10 },
            { wch: 12 }, { wch: 12 }, { wch: 12 },
        ]

        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Ventas')

        const desde = fechaDesde.replace(/-/g, '')
        const hasta = fechaHasta.replace(/-/g, '')
        const nombre = fechaDesde === fechaHasta
            ? `Ventas_${desde}.xlsx`
            : `Ventas_${desde}_${hasta}.xlsx`

        XLSX.writeFile(wb, nombre)
    }

    const fmt = (n: number) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

    const ventasActivas = ventas.filter(v => !v.anulada)
    const total = ventasActivas.reduce((a, v) => a + v.total, 0)

    const hora = (str: string) =>
        new Date(str).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

    return (
        <>
            <style>{`
        .ventas-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
        .fecha-row { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
        @media (max-width: 768px) {
          .ventas-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .ventas-grid { grid-template-columns: 1fr; }
          .fecha-row { gap: 0.375rem; }
        }
      `}</style>

            <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: c.text, letterSpacing: '-0.03em' }}>Ventas</h1>
                        <p style={{ fontSize: '0.8rem', color: c.muted, marginTop: '0.2rem' }}>
                            {ventasActivas.length} ticket{ventasActivas.length !== 1 ? 's' : ''} · {fmt(total)}
                        </p>
                    </div>
                    <div className="fecha-row">
                        <input
                            type="date"
                            value={fechaDesde}
                            onChange={e => setFechaDesde(e.target.value)}
                            style={{
                                background: c.card, border: `1px solid ${c.border}`,
                                borderRadius: '10px', padding: '0.5rem 0.875rem',
                                color: c.text, fontSize: '0.85rem', outline: 'none',
                            }}
                        />
                        <span style={{ color: c.muted, fontSize: '0.85rem' }}>→</span>
                        <input
                            type="date"
                            value={fechaHasta}
                            onChange={e => setFechaHasta(e.target.value)}
                            style={{
                                background: c.card, border: `1px solid ${c.border}`,
                                borderRadius: '10px', padding: '0.5rem 0.875rem',
                                color: c.text, fontSize: '0.85rem', outline: 'none',
                            }}
                        />
                        <button
                            onClick={exportarExcel}
                            style={{
                                padding: '0.5rem 1rem', background: c.card,
                                border: `1px solid ${c.border}`, borderRadius: '10px',
                                color: c.muted, fontSize: '0.85rem', cursor: 'pointer',
                                whiteSpace: 'nowrap', transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#4ADE8050'; e.currentTarget.style.color = '#4ADE80' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.muted }}
                        >
                            ↓ Excel
                        </button>
                        <Link href="/ventas/nueva" style={{
                            background: '#C9A96E', color: '#0F1A09',
                            padding: '0.5rem 1.1rem', borderRadius: '10px',
                            fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none',
                            whiteSpace: 'nowrap',
                        }}>
                            + Nueva
                        </Link>
                    </div>
                </div>

                {/* KPIs */}
                <div className="ventas-grid">
                    {[
                        { label: 'Total del período', value: fmt(total), color: '#4ADE80', bg: '#4ADE8010', border: '#4ADE8025' },
                        { label: 'Tickets', value: ventasActivas.length, color: '#60A5FA', bg: '#60A5FA10', border: '#60A5FA25' },
                        { label: 'Anuladas', value: ventas.filter(v => v.anulada).length, color: '#F87171', bg: '#F8717110', border: '#F8717125' },
                    ].map(k => (
                        <div key={k.label} style={{
                            background: k.bg, border: `1px solid ${k.border}`,
                            borderRadius: '16px', padding: '1rem 1.25rem',
                        }}>
                            <p style={{ fontSize: '0.68rem', color: c.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>{k.label}</p>
                            <p style={{ fontSize: '1.4rem', fontWeight: 700, color: k.color, letterSpacing: '-0.03em' }}>{k.value}</p>
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
                        Sin ventas para este período
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
                                        background: 'transparent', border: 'none', cursor: 'pointer', gap: '0.5rem',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = c.card2)}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '0.75rem', color: c.muted2 }}>
                                            {v.fecha !== new Date().toISOString().split('T')[0] ? v.fecha + ' · ' : ''}{hora(v.created_at)}
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
                                        {v.dni_cliente && (
                                            <span style={{
                                                fontSize: '0.72rem', padding: '0.2rem 0.6rem',
                                                borderRadius: '6px', background: '#34D39920',
                                                color: '#34D399', fontWeight: 500,
                                            }}>
                                                DNI {v.dni_cliente}
                                            </span>
                                        )}
                                        <span style={{ fontSize: '0.78rem', color: c.muted2 }}>
                                            {v.venta_items.length} item{v.venta_items.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '1rem', fontWeight: 700, color: v.anulada ? '#F87171' : '#4ADE80', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
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
                                                <span style={{ fontSize: '0.85rem', color: '#C9A96E', fontWeight: 500 }}>{fmt(item.subtotal)}</span>
                                            </div>
                                        ))}

                                        {v.descuento > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: `1px solid ${c.border}` }}>
                                                <span style={{ fontSize: '0.85rem', color: '#A78BFA' }}>Descuento</span>
                                                <span style={{ fontSize: '0.85rem', color: '#A78BFA' }}>−{fmt(v.descuento)}</span>
                                            </div>
                                        )}

                                        {v.dni_cliente && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.25rem' }}>
                                                <span style={{ fontSize: '0.78rem', color: c.muted }}>DNI / CUIT</span>
                                                <span style={{ fontSize: '0.78rem', color: '#34D399' }}>{v.dni_cliente}</span>
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
        </>
    )
}