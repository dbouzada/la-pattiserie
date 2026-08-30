'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTema } from '@/lib/theme'

interface Producto {
    id: number
    nombre: string
    stock: number
    costo: number
    packaging: number
    costo_total: number
    precio_kg: number | null
    precio_venta: number
    venta_por: string
    activo: boolean
}

export default function Productos() {
    const { tema } = useTema()
    const [productos, setProductos] = useState<Producto[]>([])
    const [loading, setLoading] = useState(true)
    const [editando, setEditando] = useState<Producto | null>(null)
    const [guardando, setGuardando] = useState(false)
    const [busqueda, setBusqueda] = useState('')

    const c = {
        bg: tema === 'oscuro' ? '#0F1A09' : '#F7F5F0',
        card: tema === 'oscuro' ? '#162210' : '#FFFFFF',
        card2: tema === 'oscuro' ? '#1E2E14' : '#F0EDE4',
        border: tema === 'oscuro' ? '#2A4A1A' : '#E5E0D8',
        text: tema === 'oscuro' ? '#E8E4D8' : '#1A1A14',
        muted: tema === 'oscuro' ? '#8BAA6E' : '#9B9B8A',
        muted2: tema === 'oscuro' ? '#4A6A3A' : '#C5C0B0',
        input: tema === 'oscuro' ? '#1E2E14' : '#F7F5F0',
    }

    const cargar = async () => {
        const { data } = await supabase.from('productos').select('*').order('nombre')
        setProductos(data || [])
        setLoading(false)
    }

    useEffect(() => { cargar() }, [])

    const guardar = async () => {
        if (!editando) return
        setGuardando(true)
        await supabase.from('productos').update({
            precio_venta: editando.precio_venta,
            precio_kg: editando.precio_kg,
            costo: editando.costo,
            packaging: editando.packaging,
            activo: editando.activo,
        }).eq('id', editando.id)
        await cargar()
        setEditando(null)
        setGuardando(false)
    }

    const fmt = (n: number) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

    const margen = (p: Producto) =>
        (((p.precio_venta - p.costo_total) / p.precio_venta) * 100).toFixed(0)

    const filtrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    )

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <div style={{ color: c.muted2, fontSize: '0.9rem' }}>Cargando...</div>
        </div>
    )

    return (
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: c.text, letterSpacing: '-0.03em' }}>Productos</h1>
                    <p style={{ fontSize: '0.8rem', color: c.muted, marginTop: '0.2rem' }}>
                        {productos.length} productos · {productos.filter(p => p.activo).length} activos
                    </p>
                </div>
                <input
                    type="text"
                    placeholder="Buscar..."
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    style={{
                        background: c.card, border: `1px solid ${c.border}`,
                        borderRadius: '10px', padding: '0.5rem 1rem',
                        color: c.text, fontSize: '0.85rem', outline: 'none', width: '220px',
                    }}
                    onFocus={e => e.target.style.borderColor = '#F59E0B50'}
                    onBlur={e => e.target.style.borderColor = c.border}
                />
            </div>

            {/* Tabla */}
            <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '16px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                        <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                            {['Producto', 'Costo', 'Precio', 'Margen', 'Stock', 'Estado', ''].map(h => (
                                <th key={h} style={{
                                    padding: '0.875rem 1rem',
                                    textAlign: h === 'Producto' || h === '' ? 'left' : 'right',
                                    fontSize: '0.72rem', color: c.muted,
                                    textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500,
                                }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtrados.map((p, i) => {
                            const m = Number(margen(p))
                            return (
                                <tr key={p.id} style={{
                                    borderBottom: i < filtrados.length - 1 ? `1px solid ${c.border}` : 'none',
                                    opacity: p.activo ? 1 : 0.4,
                                }}>
                                    <td style={{ padding: '0.875rem 1rem', color: c.text, fontWeight: 500 }}>{p.nombre}</td>
                                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right', color: c.muted }}>{fmt(p.costo_total)}</td>
                                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right', color: '#F59E0B', fontWeight: 600 }}>{fmt(p.precio_venta)}</td>
                                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                                        <span style={{ color: m >= 50 ? '#4ADE80' : m >= 35 ? '#FBBF24' : '#F87171', fontWeight: 500 }}>
                                            {m}%
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                                        <span style={{ color: p.stock <= 0 ? '#F87171' : p.stock < 10 ? '#FBBF24' : c.muted, fontWeight: 500 }}>
                                            {p.stock}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                                        <span style={{
                                            fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '6px',
                                            background: p.activo ? '#4ADE8015' : c.card2,
                                            color: p.activo ? '#4ADE80' : c.muted, fontWeight: 500,
                                        }}>
                                            {p.activo ? 'activo' : 'inactivo'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                                        <button
                                            onClick={() => setEditando(p)}
                                            style={{
                                                background: 'transparent', border: `1px solid ${c.border}`,
                                                borderRadius: '8px', padding: '0.3rem 0.75rem',
                                                color: c.muted, fontSize: '0.78rem', cursor: 'pointer',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#F59E0B50'; e.currentTarget.style.color = '#F59E0B' }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.muted }}
                                        >
                                            editar
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {editando && (
                <div style={{
                    position: 'fixed', inset: 0, background: '#00000080',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 50, padding: '1rem', backdropFilter: 'blur(4px)',
                }}>
                    <div style={{
                        background: c.card, border: `1px solid ${c.border}`,
                        borderRadius: '20px', padding: '2rem',
                        width: '100%', maxWidth: '420px',
                        display: 'flex', flexDirection: 'column', gap: '1rem',
                    }}>
                        <div>
                            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: c.text }}>{editando.nombre}</h2>
                            <p style={{ fontSize: '0.78rem', color: c.muted, marginTop: '0.2rem' }}>Editando precio y costos</p>
                        </div>

                        {[
                            { label: 'Precio de venta', key: 'precio_venta' },
                            { label: 'Costo', key: 'costo' },
                            { label: 'Packaging', key: 'packaging' },
                            { label: 'Precio por kg', key: 'precio_kg' },
                        ].map(({ label, key }) => (
                            <div key={key}>
                                <label style={{ fontSize: '0.72rem', color: c.muted, display: 'block', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    {label}
                                </label>
                                <input
                                    type="number"
                                    value={(editando as any)[key] || ''}
                                    onChange={e => setEditando({ ...editando, [key]: Number(e.target.value) })}
                                    style={{
                                        width: '100%', background: c.input,
                                        border: `1px solid ${c.border}`, borderRadius: '10px',
                                        padding: '0.75rem 1rem', color: c.text,
                                        fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                                    }}
                                    onFocus={e => e.target.style.borderColor = '#F59E0B50'}
                                    onBlur={e => e.target.style.borderColor = c.border}
                                />
                            </div>
                        ))}

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.85rem', color: c.muted }}>Producto activo</span>
                            <button
                                onClick={() => setEditando({ ...editando, activo: !editando.activo })}
                                style={{
                                    width: '44px', height: '24px', borderRadius: '12px',
                                    background: editando.activo ? '#F59E0B' : c.border,
                                    border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                                }}
                            >
                                <span style={{
                                    position: 'absolute', top: '3px',
                                    left: editando.activo ? '22px' : '3px',
                                    width: '18px', height: '18px',
                                    background: '#fff', borderRadius: '50%', transition: 'left 0.2s',
                                }} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                            <button
                                onClick={() => setEditando(null)}
                                style={{
                                    flex: 1, padding: '0.75rem', background: 'transparent',
                                    border: `1px solid ${c.border}`, borderRadius: '10px',
                                    color: c.muted, fontSize: '0.875rem', cursor: 'pointer',
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={guardar}
                                disabled={guardando}
                                style={{
                                    flex: 1, padding: '0.75rem', background: '#F59E0B',
                                    border: 'none', borderRadius: '10px', color: '#0A0A0F',
                                    fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                                }}
                            >
                                {guardando ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}