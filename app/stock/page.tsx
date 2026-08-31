'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTema } from '@/lib/theme'

interface Producto {
    id: number
    nombre: string
    stock: number
}

export default function Stock() {
    const { tema } = useTema()
    const [productos, setProductos] = useState<Producto[]>([])
    const [loading, setLoading] = useState(true)
    const [ajustes, setAjustes] = useState<Record<number, number>>({})
    const [guardando, setGuardando] = useState<number | null>(null)
    const [busqueda, setBusqueda] = useState('')

    const c = {
        card: tema === 'oscuro' ? '#162210' : '#F7F3EC',
        card2: tema === 'oscuro' ? '#1E2E14' : '#EDE8DF',
        border: tema === 'oscuro' ? '#2A4A1A' : '#C8BFA8',
        text: tema === 'oscuro' ? '#E8E4D8' : '#1A1A14',
        muted: tema === 'oscuro' ? '#8BAA6E' : '#6B6550',
        muted2: tema === 'oscuro' ? '#4A6A3A' : '#9B9280',
    }

    const cargar = async () => {
        const { data } = await supabase
            .from('productos')
            .select('id, nombre, stock')
            .eq('activo', true)
            .order('nombre')
        setProductos(data || [])
        setLoading(false)
    }

    useEffect(() => { cargar() }, [])

    const ajustar = async (id: number, nuevoStock: number) => {
        setGuardando(id)
        await supabase.from('productos').update({ stock: nuevoStock }).eq('id', id)
        await cargar()
        setAjustes(prev => { const n = { ...prev }; delete n[id]; return n })
        setGuardando(null)
    }

    const filtrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    )

    const criticos = productos.filter(p => p.stock <= 0)
    const bajos = productos.filter(p => p.stock > 0 && p.stock < 10)

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <div style={{ color: c.muted2, fontSize: '0.9rem' }}>Cargando...</div>
        </div>
    )

    return (
        <>
            <style>{`
        .stock-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
        @media (max-width: 640px) {
          .stock-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

            <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: c.text, letterSpacing: '-0.03em' }}>Stock</h1>
                        <p style={{ fontSize: '0.8rem', color: c.muted, marginTop: '0.2rem' }}>
                            {criticos.length > 0 && <span style={{ color: '#F87171' }}>{criticos.length} sin stock · </span>}
                            {bajos.length > 0 && <span style={{ color: '#C9A96E' }}>{bajos.length} stock bajo · </span>}
                            {productos.length} productos
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
                            color: c.text, fontSize: '0.85rem', outline: 'none',
                            width: '100%', maxWidth: '220px', boxSizing: 'border-box' as const,
                        }}
                        onFocus={e => e.target.style.borderColor = '#C9A96E50'}
                        onBlur={e => e.target.style.borderColor = c.border}
                    />
                </div>

                {/* KPIs */}
                <div className="stock-grid">
                    {[
                        { label: 'Sin stock', value: criticos.length, color: '#F87171', bg: '#F8717110', border: '#F8717125' },
                        { label: 'Stock bajo', value: bajos.length, color: '#C9A96E', bg: '#C9A96E10', border: '#C9A96E25' },
                        { label: 'OK', value: productos.length - criticos.length - bajos.length, color: '#4ADE80', bg: '#4ADE8010', border: '#4ADE8025' },
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

                {/* Tabla */}
                <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '16px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                                {['Producto', 'Stock actual', 'Nuevo stock', ''].map(h => (
                                    <th key={h} style={{
                                        padding: '0.875rem 1rem',
                                        textAlign: h === 'Producto' ? 'left' : 'right',
                                        fontSize: '0.72rem', color: c.muted,
                                        textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500,
                                        whiteSpace: 'nowrap',
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtrados.map((p, i) => {
                                const nuevo = ajustes[p.id] ?? p.stock
                                const cambio = nuevo !== p.stock
                                return (
                                    <tr key={p.id} style={{ borderBottom: i < filtrados.length - 1 ? `1px solid ${c.border}` : 'none' }}>
                                        <td style={{ padding: '0.875rem 1rem', color: c.text, fontWeight: 500, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {p.nombre}
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                                            <span style={{
                                                fontSize: '0.9rem', fontWeight: 600,
                                                color: p.stock <= 0 ? '#F87171' : p.stock < 10 ? '#C9A96E' : c.muted,
                                            }}>
                                                {p.stock}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                                            <input
                                                type="number"
                                                value={nuevo}
                                                onChange={e => setAjustes({ ...ajustes, [p.id]: Number(e.target.value) })}
                                                style={{
                                                    width: '70px', background: c.card2,
                                                    border: `1px solid ${cambio ? '#C9A96E50' : c.border}`,
                                                    borderRadius: '8px', padding: '0.375rem 0.5rem',
                                                    color: cambio ? '#C9A96E' : c.text,
                                                    fontSize: '0.875rem', textAlign: 'right', outline: 'none',
                                                    fontWeight: cambio ? 600 : 400,
                                                }}
                                            />
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                                            <button
                                                onClick={() => ajustar(p.id, nuevo)}
                                                disabled={!cambio || guardando === p.id}
                                                style={{
                                                    padding: '0.375rem 0.75rem', borderRadius: '8px',
                                                    fontSize: '0.78rem', fontWeight: 500, border: 'none',
                                                    cursor: cambio ? 'pointer' : 'not-allowed',
                                                    background: cambio ? '#C9A96E' : c.card2,
                                                    color: cambio ? '#0F1A09' : c.muted2,
                                                    transition: 'all 0.15s', whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {guardando === p.id ? '...' : 'Guardar'}
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    )
}