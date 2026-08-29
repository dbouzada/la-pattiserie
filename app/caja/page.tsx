'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Caja() {
    const [loading, setLoading] = useState(true)
    const [guardando, setGuardando] = useState(false)
    const [exito, setExito] = useState(false)
    const [notas, setNotas] = useState('')
    const [totales, setTotales] = useState({
        efectivo: 0, tarjeta: 0, transferencia: 0, mercadopago: 0, pedidosya: 0,
    })

    const hoy = new Date().toISOString().split('T')[0]

    const cargar = async () => {
        const { data: ventas } = await supabase
            .from('ventas').select('medio_pago, total').eq('fecha', hoy)

        const { data: arqueo } = await supabase
            .from('arqueo_caja').select('notas').eq('fecha', hoy).single()

        const t = { efectivo: 0, tarjeta: 0, transferencia: 0, mercadopago: 0, pedidosya: 0 }
        ventas?.forEach(v => {
            if (v.medio_pago in t) (t as any)[v.medio_pago] += v.total
        })

        setTotales(t)
        setNotas(arqueo?.notas || '')
        setLoading(false)
    }

    useEffect(() => { cargar() }, [])

    const guardar = async () => {
        setGuardando(true)
        await supabase.from('arqueo_caja').upsert({
            fecha: hoy,
            total_efectivo: totales.efectivo,
            total_tarjeta: totales.tarjeta,
            total_transfer: totales.transferencia,
            total_mp: totales.mercadopago,
            total_pedidosya: totales.pedidosya,
            notas,
        }, { onConflict: 'fecha' })
        setExito(true)
        setTimeout(() => setExito(false), 3000)
        setGuardando(false)
    }

    const fmt = (n: number) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

    const total = Object.values(totales).reduce((a, b) => a + b, 0)

    const medios = [
        { label: 'Efectivo', value: totales.efectivo, color: '#FBBF24' },
        { label: 'Tarjeta', value: totales.tarjeta, color: '#60A5FA' },
        { label: 'Transferencia', value: totales.transferencia, color: '#A78BFA' },
        { label: 'Mercado Pago', value: totales.mercadopago, color: '#34D399' },
        { label: 'Pedidos Ya', value: totales.pedidosya, color: '#F87171' },
    ]

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <div style={{ color: '#2A2A35', fontSize: '0.9rem' }}>Cargando...</div>
        </div>
    )

    return (
        <div style={{ maxWidth: '560px', margin: '0 auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Header */}
            <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F0EDE6', letterSpacing: '-0.03em' }}>Caja del día</h1>
                <p style={{ fontSize: '0.8rem', color: '#3A3A4A', marginTop: '0.2rem' }}>
                    {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
            </div>

            {exito && (
                <div style={{
                    background: '#4ADE8015',
                    border: '1px solid #4ADE8030',
                    color: '#4ADE80',
                    padding: '0.875rem 1rem',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                }}>
                    ✓ Arqueo guardado correctamente
                </div>
            )}

            {/* Total grande */}
            <div style={{
                background: '#4ADE8010',
                border: '1px solid #4ADE8025',
                borderRadius: '20px',
                padding: '2rem',
                textAlign: 'center',
            }}>
                <p style={{ fontSize: '0.72rem', color: '#3A3A4A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
                    Total del día
                </p>
                <p style={{ fontSize: '3rem', fontWeight: 800, color: '#4ADE80', letterSpacing: '-0.04em', lineHeight: 1 }}>
                    {fmt(total)}
                </p>
            </div>

            {/* Desglose */}
            <div style={{
                background: '#0F0F18',
                border: '1px solid #1E1E2E',
                borderRadius: '16px',
                overflow: 'hidden',
            }}>
                {medios.map((m, i) => (
                    <div key={m.label} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1rem 1.25rem',
                        borderBottom: i < medios.length - 1 ? '1px solid #1E1E2E' : 'none',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: '8px', height: '8px',
                                borderRadius: '50%',
                                background: m.value > 0 ? m.color : '#2A2A35',
                            }} />
                            <span style={{ fontSize: '0.875rem', color: m.value > 0 ? '#E8E6E0' : '#3A3A4A' }}>
                                {m.label}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {total > 0 && m.value > 0 && (
                                <span style={{ fontSize: '0.75rem', color: '#3A3A4A' }}>
                                    {((m.value / total) * 100).toFixed(0)}%
                                </span>
                            )}
                            <span style={{
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                color: m.value > 0 ? m.color : '#2A2A35',
                            }}>
                                {fmt(m.value)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Barra visual */}
            {total > 0 && (
                <div style={{ height: '6px', borderRadius: '6px', overflow: 'hidden', display: 'flex', gap: '2px' }}>
                    {medios.filter(m => m.value > 0).map(m => (
                        <div key={m.label} style={{
                            height: '100%',
                            width: `${(m.value / total) * 100}%`,
                            background: m.color,
                            borderRadius: '6px',
                            transition: 'width 0.5s ease',
                        }} />
                    ))}
                </div>
            )}

            {/* Notas */}
            <div>
                <label style={{
                    fontSize: '0.72rem',
                    color: '#3A3A4A',
                    display: 'block',
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                }}>
                    Notas del día
                </label>
                <textarea
                    value={notas}
                    onChange={e => setNotas(e.target.value)}
                    rows={3}
                    placeholder="Observaciones, gastos, novedades..."
                    style={{
                        width: '100%',
                        background: '#0F0F18',
                        border: '1px solid #1E1E2E',
                        borderRadius: '12px',
                        padding: '0.875rem 1rem',
                        color: '#E8E6E0',
                        fontSize: '0.875rem',
                        outline: 'none',
                        resize: 'none',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit',
                    }}
                    onFocus={e => e.target.style.borderColor = '#F59E0B50'}
                    onBlur={e => e.target.style.borderColor = '#1E1E2E'}
                />
            </div>

            {/* Botón */}
            <button
                onClick={guardar}
                disabled={guardando}
                style={{
                    width: '100%',
                    padding: '1rem',
                    background: guardando ? '#16161F' : '#F59E0B',
                    color: guardando ? '#2A2A35' : '#0A0A0F',
                    border: 'none',
                    borderRadius: '14px',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: guardando ? 'not-allowed' : 'pointer',
                    letterSpacing: '-0.01em',
                    transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!guardando) (e.currentTarget.style.background = '#FBBF24') }}
                onMouseLeave={e => { if (!guardando) (e.currentTarget.style.background = '#F59E0B') }}
            >
                {guardando ? 'Guardando...' : 'Guardar arqueo del día'}
            </button>
        </div>
    )
}