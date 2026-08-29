'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTema } from '@/lib/theme'
import jsPDF from 'jspdf'

export default function Caja() {
    const { tema } = useTema()
    const [loading, setLoading] = useState(true)
    const [guardando, setGuardando] = useState(false)
    const [exito, setExito] = useState(false)
    const [notas, setNotas] = useState('')
    const [totales, setTotales] = useState({
        efectivo: 0, tarjeta: 0, transferencia: 0, mercadopago: 0, pedidosya: 0,
    })

    const c = {
        card: tema === 'oscuro' ? '#0F0F18' : '#FFFFFF',
        card2: tema === 'oscuro' ? '#16161F' : '#F0EFE9',
        border: tema === 'oscuro' ? '#1E1E2E' : '#E5E4E0',
        text: tema === 'oscuro' ? '#F0EDE6' : '#1A1A1F',
        muted: tema === 'oscuro' ? '#3A3A4A' : '#9B9B9B',
        muted2: tema === 'oscuro' ? '#2A2A35' : '#C5C4C0',
        input: tema === 'oscuro' ? '#0F0F18' : '#FFFFFF',
    }

    const hoy = new Date().toISOString().split('T')[0]

    const cargar = async () => {
        const { data: ventas } = await supabase
            .from('ventas').select('medio_pago, total')
            .eq('fecha', hoy).eq('anulada', false)

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

    const descargarPDF = () => {
        const doc = new jsPDF()
        const fechaFormateada = new Date().toLocaleDateString('es-AR').replace(/\//g, '_')
        const nombreArchivo = `Caja_${fechaFormateada}.pdf`

        doc.setFontSize(20)
        doc.setTextColor(40, 40, 40)
        doc.text('La Pattiserie', 105, 20, { align: 'center' })

        doc.setFontSize(12)
        doc.setTextColor(100, 100, 100)
        doc.text(
            `Arqueo de caja — ${new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`,
            105, 30, { align: 'center' }
        )

        doc.setDrawColor(230, 230, 230)
        doc.line(20, 36, 190, 36)

        doc.setFontSize(28)
        doc.setTextColor(40, 167, 69)
        doc.text(fmt(total), 105, 52, { align: 'center' })

        doc.setFontSize(10)
        doc.setTextColor(150, 150, 150)
        doc.text('TOTAL DEL DÍA', 105, 60, { align: 'center' })

        doc.line(20, 66, 190, 66)

        let y = 78
        doc.setFontSize(11)
        medios.forEach(m => {
            if (m.value > 0) {
                doc.setTextColor(60, 60, 60)
                doc.text(m.label, 30, y)
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(40, 40, 40)
                doc.text(fmt(m.value), 180, y, { align: 'right' })
                doc.setFont('helvetica', 'normal')
                if (total > 0) {
                    doc.setTextColor(150, 150, 150)
                    doc.setFontSize(9)
                    doc.text(`${((m.value / total) * 100).toFixed(0)}%`, 140, y)
                    doc.setFontSize(11)
                }
                y += 12
            }
        })

        doc.setDrawColor(230, 230, 230)
        doc.line(20, y, 190, y)
        y += 12

        if (notas) {
            doc.setFontSize(10)
            doc.setTextColor(100, 100, 100)
            doc.text('Notas:', 30, y)
            y += 8
            doc.setTextColor(60, 60, 60)
            const lineas = doc.splitTextToSize(notas, 150)
            doc.text(lineas, 30, y)
        }

        doc.setFontSize(8)
        doc.setTextColor(180, 180, 180)
        doc.text(`Generado el ${new Date().toLocaleString('es-AR')}`, 105, 280, { align: 'center' })

        doc.save(nombreArchivo)
    }

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <div style={{ color: c.muted2, fontSize: '0.9rem' }}>Cargando...</div>
        </div>
    )

    return (
        <div style={{ maxWidth: '560px', margin: '0 auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Header */}
            <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: c.text, letterSpacing: '-0.03em' }}>Caja del día</h1>
                <p style={{ fontSize: '0.8rem', color: c.muted, marginTop: '0.2rem' }}>
                    {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
            </div>

            {exito && (
                <div style={{
                    background: '#4ADE8015', border: '1px solid #4ADE8030',
                    color: '#4ADE80', padding: '0.875rem 1rem',
                    borderRadius: '12px', fontSize: '0.85rem', fontWeight: 500,
                }}>
                    ✓ Arqueo guardado correctamente
                </div>
            )}

            {/* Total grande */}
            <div style={{
                background: '#4ADE8010', border: '1px solid #4ADE8025',
                borderRadius: '20px', padding: '2rem', textAlign: 'center',
            }}>
                <p style={{ fontSize: '0.72rem', color: c.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
                    Total del día
                </p>
                <p style={{ fontSize: '3rem', fontWeight: 800, color: '#4ADE80', letterSpacing: '-0.04em', lineHeight: 1 }}>
                    {fmt(total)}
                </p>
            </div>

            {/* Desglose */}
            <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '16px', overflow: 'hidden' }}>
                {medios.map((m, i) => (
                    <div key={m.label} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '1rem 1.25rem',
                        borderBottom: i < medios.length - 1 ? `1px solid ${c.border}` : 'none',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                background: m.value > 0 ? m.color : c.muted2,
                            }} />
                            <span style={{ fontSize: '0.875rem', color: m.value > 0 ? c.text : c.muted }}>
                                {m.label}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {total > 0 && m.value > 0 && (
                                <span style={{ fontSize: '0.75rem', color: c.muted }}>
                                    {((m.value / total) * 100).toFixed(0)}%
                                </span>
                            )}
                            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: m.value > 0 ? m.color : c.muted2 }}>
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
                            background: m.color, borderRadius: '6px',
                        }} />
                    ))}
                </div>
            )}

            {/* Notas */}
            <div>
                <label style={{
                    fontSize: '0.72rem', color: c.muted, display: 'block',
                    marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>
                    Notas del día
                </label>
                <textarea
                    value={notas}
                    onChange={e => setNotas(e.target.value)}
                    rows={3}
                    placeholder="Observaciones, gastos, novedades..."
                    style={{
                        width: '100%', background: c.input,
                        border: `1px solid ${c.border}`, borderRadius: '12px',
                        padding: '0.875rem 1rem', color: c.text,
                        fontSize: '0.875rem', outline: 'none', resize: 'none',
                        boxSizing: 'border-box', fontFamily: 'inherit',
                    }}
                    onFocus={e => e.target.style.borderColor = '#F59E0B50'}
                    onBlur={e => e.target.style.borderColor = c.border}
                />
            </div>

            {/* Botones */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                    onClick={guardar}
                    disabled={guardando}
                    style={{
                        flex: 1, padding: '1rem',
                        background: guardando ? c.card2 : '#F59E0B',
                        color: guardando ? c.muted2 : '#0A0A0F',
                        border: 'none', borderRadius: '14px',
                        fontSize: '1rem', fontWeight: 700,
                        cursor: guardando ? 'not-allowed' : 'pointer',
                        letterSpacing: '-0.01em', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (!guardando) (e.currentTarget.style.background = '#FBBF24') }}
                    onMouseLeave={e => { if (!guardando) (e.currentTarget.style.background = '#F59E0B') }}
                >
                    {guardando ? 'Guardando...' : 'Guardar arqueo'}
                </button>

                <button
                    onClick={descargarPDF}
                    style={{
                        padding: '1rem 1.5rem', background: c.card,
                        color: c.text, border: `1px solid ${c.border}`,
                        borderRadius: '14px', fontSize: '1rem', fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#F59E0B50'; e.currentTarget.style.color = '#F59E0B' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.text }}
                >
                    ↓ PDF
                </button>
            </div>
        </div>
    )
}