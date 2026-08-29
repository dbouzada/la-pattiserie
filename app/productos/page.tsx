'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

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
    const [productos, setProductos] = useState<Producto[]>([])
    const [loading, setLoading] = useState(true)
    const [editando, setEditando] = useState<Producto | null>(null)
    const [guardando, setGuardando] = useState(false)
    const [busqueda, setBusqueda] = useState('')

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
            <div style={{ color: '#2A2A35', fontSize: '0.9rem' }}>Cargando...</div>
        </div>
    )

    return (
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F0EDE6', letterSpacing: '-0.03em' }}>Productos</h1>
                    <p style={{ fontSize: '0.8rem', color: '#3A3A4A', marginTop: '0.2rem' }}>{productos.length} productos · {productos.filter(p => p.activo).length} activos</p>
                </div>
                <input
                    type="text"
                    placeholder="Buscar..."
                    onChange={e => setBusqueda(e.target.value as any)}
                    style={{
                        background: '#0F0F18',
                        border: '1px solid #1E1E2E',
                        borderRadius: '10px',
                        padding: '0.5rem 1rem',
                        color: '#E8E6E0',
                        fontSize: '0.85rem',
                        outline: 'none',
                        width: '220px',
                    }}
                    onFocus={e => e.target.style.borderColor = '#F59E0B50'}
                    onBlur={e => e.target.style.borderColor = '#1E1E2E'}
                />
            </div>

            {/* Tabla */}
            <div style={{
                background: '#0F0F18',
                border: '1px solid #1E1E2E',
                borderRadius: '16px',
                overflow: 'hidden',
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #1E1E2E' }}>
                            {['Producto', 'Costo', 'Precio', 'Margen', 'Stock', 'Estado', ''].map(h => (
                                <th key={h} style={{
                                    padding: '0.875rem 1rem',
                                    textAlign: h === 'Producto' || h === '' ? 'left' : 'right',
                                    fontSize: '0.72rem',
                                    color: '#3A3A4A',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.06em',
                                    fontWeight: 500,
                                }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {productos.map((p, i) => {
                            const m = Number(margen(p))
                            return (
                                <tr
                                    key={p.id}
                                    style={{
                                        borderBottom: i < productos.length - 1 ? '1px solid #1E1E2E' : 'none',
                                        opacity: p.activo ? 1 : 0.35,
                                    }}
                                >
                                    <td style={{ padding: '0.875rem 1rem', color: '#E8E6E0', fontWeight: 500 }}>{p.nombre}</td>
                                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right', color: '#3A3A4A' }}>{fmt(p.costo_total)}</td>
                                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right', color: '#F59E0B', fontWeight: 600 }}>{fmt(p.precio_venta)}</td>
                                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                                        <span style={{ color: m >= 50 ? '#4ADE80' : m >= 35 ? '#FBBF24' : '#F87171', fontWeight: 500 }}>
                                            {m}%
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                                        <span style={{ color: p.stock <= 0 ? '#F87171' : p.stock < 10 ? '#FBBF24' : '#6B6B80', fontWeight: 500 }}>
                                            {p.stock}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                                        <span style={{
                                            fontSize: '0.72rem',
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '6px',
                                            background: p.activo ? '#4ADE8015' : '#1E1E2E',
                                            color: p.activo ? '#4ADE80' : '#3A3A4A',
                                            fontWeight: 500,
                                        }}>
                                            {p.activo ? 'activo' : 'inactivo'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                                        <button
                                            onClick={() => setEditando(p)}
                                            style={{
                                                background: 'transparent',
                                                border: '1px solid #1E1E2E',
                                                borderRadius: '8px',
                                                padding: '0.3rem 0.75rem',
                                                color: '#6B6B80',
                                                fontSize: '0.78rem',
                                                cursor: 'pointer',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#F59E0B50'; e.currentTarget.style.color = '#F59E0B' }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1E1E2E'; e.currentTarget.style.color = '#6B6B80' }}
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
                    position: 'fixed', inset: 0,
                    background: '#00000080',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 50, padding: '1rem',
                    backdropFilter: 'blur(4px)',
                }}>
                    <div style={{
                        background: '#0F0F18',
                        border: '1px solid #1E1E2E',
                        borderRadius: '20px',
                        padding: '2rem',
                        width: '100%',
                        maxWidth: '420px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                    }}>
                        <div>
                            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#F0EDE6', letterSpacing: '-0.02em' }}>
                                {editando.nombre}
                            </h2>
                            <p style={{ fontSize: '0.78rem', color: '#3A3A4A', marginTop: '0.2rem' }}>Editando precio y costos</p>
                        </div>

                        {[
                            { label: 'Precio de venta', key: 'precio_venta' },
                            { label: 'Costo', key: 'costo' },
                            { label: 'Packaging', key: 'packaging' },
                            { label: 'Precio por kg', key: 'precio_kg' },
                        ].map(({ label, key }) => (
                            <div key={key}>
                                <label style={{ fontSize: '0.72rem', color: '#3A3A4A', display: 'block', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    {label}
                                </label>
                                <input
                                    type="number"
                                    value={(editando as any)[key] || ''}
                                    onChange={e => setEditando({ ...editando, [key]: Number(e.target.value) })}
                                    style={{
                                        width: '100%',
                                        background: '#16161F',
                                        border: '1px solid #1E1E2E',
                                        borderRadius: '10px',
                                        padding: '0.75rem 1rem',
                                        color: '#E8E6E0',
                                        fontSize: '0.9rem',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                    }}
                                    onFocus={e => e.target.style.borderColor = '#F59E0B50'}
                                    onBlur={e => e.target.style.borderColor = '#1E1E2E'}
                                />
                            </div>
                        ))}

                        {/* Toggle activo */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.85rem', color: '#6B6B80' }}>Producto activo</span>
                            <button
                                onClick={() => setEditando({ ...editando, activo: !editando.activo })}
                                style={{
                                    width: '44px', height: '24px',
                                    borderRadius: '12px',
                                    background: editando.activo ? '#F59E0B' : '#1E1E2E',
                                    border: 'none',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    transition: 'background 0.2s',
                                }}
                            >
                                <span style={{
                                    position: 'absolute',
                                    top: '3px',
                                    left: editando.activo ? '22px' : '3px',
                                    width: '18px', height: '18px',
                                    background: '#fff',
                                    borderRadius: '50%',
                                    transition: 'left 0.2s',
                                }} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                            <button
                                onClick={() => setEditando(null)}
                                style={{
                                    flex: 1, padding: '0.75rem',
                                    background: 'transparent',
                                    border: '1px solid #1E1E2E',
                                    borderRadius: '10px',
                                    color: '#6B6B80',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={guardar}
                                disabled={guardando}
                                style={{
                                    flex: 1, padding: '0.75rem',
                                    background: '#F59E0B',
                                    border: 'none',
                                    borderRadius: '10px',
                                    color: '#0A0A0F',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
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