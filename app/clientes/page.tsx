'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Cliente {
    id: number
    nombre: string
    dni: string | null
    mail: string | null
    telefono: string | null
    notas: string | null
    cantidad_compras: number
    total_gastado: number
    ultima_compra: string | null
}

const clienteVacio = {
    nombre: '',
    dni: '',
    mail: '',
    telefono: '',
    notas: '',
}

export default function Clientes() {
    const [clientes, setClientes] = useState<Cliente[]>([])
    const [loading, setLoading] = useState(true)
    const [busqueda, setBusqueda] = useState('')
    const [modal, setModal] = useState(false)
    const [editando, setEditando] = useState<Cliente | null>(null)
    const [form, setForm] = useState(clienteVacio)
    const [guardando, setGuardando] = useState(false)
    const [detalle, setDetalle] = useState<Cliente | null>(null)
    const [historial, setHistorial] = useState<any[]>([])

    const cargar = async () => {
        const { data } = await supabase
            .from('historial_clientes')
            .select('*')
        setClientes(data || [])
        setLoading(false)
    }

    useEffect(() => { cargar() }, [])

    const abrirNuevo = () => {
        setEditando(null)
        setForm(clienteVacio)
        setModal(true)
    }

    const abrirEditar = (c: Cliente) => {
        setEditando(c)
        setForm({
            nombre: c.nombre,
            dni: c.dni || '',
            mail: c.mail || '',
            telefono: c.telefono || '',
            notas: c.notas || '',
        })
        setModal(true)
    }

    const guardar = async () => {
        if (!form.nombre.trim()) return
        setGuardando(true)

        if (editando) {
            await supabase.from('clientes').update({
                nombre: form.nombre,
                dni: form.dni || null,
                mail: form.mail || null,
                telefono: form.telefono || null,
                notas: form.notas || null,
            }).eq('id', editando.id)
        } else {
            await supabase.from('clientes').insert({
                nombre: form.nombre,
                dni: form.dni || null,
                mail: form.mail || null,
                telefono: form.telefono || null,
                notas: form.notas || null,
            })
        }

        await cargar()
        setModal(false)
        setGuardando(false)
    }

    const verDetalle = async (c: Cliente) => {
        setDetalle(c)
        if (c.dni) {
            const { data } = await supabase
                .from('ventas')
                .select('*, venta_items(id, cantidad, subtotal, productos(nombre))')
                .eq('dni_cliente', c.dni)
                .order('fecha', { ascending: false })
                .limit(10)
            setHistorial(data || [])
        } else {
            setHistorial([])
        }
    }

    const fmt = (n: number) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

    const filtrados = clientes.filter(c =>
        c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.dni?.includes(busqueda) ||
        c.mail?.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.telefono?.includes(busqueda)
    )

    const inputStyle = {
        width: '100%',
        background: '#16161F',
        border: '1px solid #1E1E2E',
        borderRadius: '10px',
        padding: '0.75rem 1rem',
        color: '#E8E6E0',
        fontSize: '0.9rem',
        outline: 'none',
        boxSizing: 'border-box' as const,
        fontFamily: 'inherit',
    }

    const labelStyle = {
        fontSize: '0.72rem',
        color: '#3A3A4A',
        display: 'block',
        marginBottom: '0.375rem',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.06em',
    }

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <div style={{ color: '#2A2A35', fontSize: '0.9rem' }}>Cargando...</div>
        </div>
    )

    return (
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F0EDE6', letterSpacing: '-0.03em' }}>Clientes</h1>
                    <p style={{ fontSize: '0.8rem', color: '#3A3A4A', marginTop: '0.2rem' }}>{clientes.length} clientes registrados</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, DNI, mail..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        style={{
                            background: '#0F0F18',
                            border: '1px solid #1E1E2E',
                            borderRadius: '10px',
                            padding: '0.5rem 1rem',
                            color: '#E8E6E0',
                            fontSize: '0.85rem',
                            outline: 'none',
                            width: '280px',
                        }}
                        onFocus={e => e.target.style.borderColor = '#F59E0B50'}
                        onBlur={e => e.target.style.borderColor = '#1E1E2E'}
                    />
                    <button
                        onClick={abrirNuevo}
                        style={{
                            background: '#F59E0B',
                            color: '#0A0A0F',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '0.5rem 1.1rem',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        + Nuevo cliente
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {[
                    { label: 'Total clientes', value: clientes.length, color: '#60A5FA', bg: '#60A5FA10', border: '#60A5FA25' },
                    { label: 'Con compras', value: clientes.filter(c => c.cantidad_compras > 0).length, color: '#4ADE80', bg: '#4ADE8010', border: '#4ADE8025' },
                    { label: 'Total facturado', value: fmt(clientes.reduce((a, c) => a + (c.total_gastado || 0), 0)), color: '#F59E0B', bg: '#F59E0B10', border: '#F59E0B25' },
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

            {/* Tabla */}
            <div style={{ background: '#0F0F18', border: '1px solid #1E1E2E', borderRadius: '16px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #1E1E2E' }}>
                            {['Nombre', 'DNI', 'Contacto', 'Compras', 'Total gastado', 'Última compra', ''].map(h => (
                                <th key={h} style={{
                                    padding: '0.875rem 1rem',
                                    textAlign: h === 'Nombre' || h === '' ? 'left' : 'right',
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
                        {filtrados.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#2A2A35' }}>
                                    {busqueda ? 'Sin resultados' : 'Sin clientes registrados'}
                                </td>
                            </tr>
                        )}
                        {filtrados.map((c, i) => (
                            <tr key={c.id} style={{ borderBottom: i < filtrados.length - 1 ? '1px solid #1E1E2E' : 'none' }}>
                                <td style={{ padding: '0.875rem 1rem' }}>
                                    <div>
                                        <p style={{ color: '#E8E6E0', fontWeight: 500 }}>{c.nombre}</p>
                                        {c.notas && <p style={{ color: '#3A3A4A', fontSize: '0.75rem', marginTop: '0.1rem' }}>{c.notas}</p>}
                                    </div>
                                </td>
                                <td style={{ padding: '0.875rem 1rem', textAlign: 'right', color: '#6B6B80' }}>{c.dni || '—'}</td>
                                <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                                    <div>
                                        {c.mail && <p style={{ color: '#6B6B80', fontSize: '0.8rem' }}>{c.mail}</p>}
                                        {c.telefono && <p style={{ color: '#6B6B80', fontSize: '0.8rem' }}>{c.telefono}</p>}
                                        {!c.mail && !c.telefono && <span style={{ color: '#2A2A35' }}>—</span>}
                                    </div>
                                </td>
                                <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                                    <span style={{ color: c.cantidad_compras > 0 ? '#60A5FA' : '#2A2A35', fontWeight: 500 }}>
                                        {c.cantidad_compras || 0}
                                    </span>
                                </td>
                                <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                                    <span style={{ color: c.total_gastado > 0 ? '#F59E0B' : '#2A2A35', fontWeight: 600 }}>
                                        {c.total_gastado ? fmt(c.total_gastado) : '—'}
                                    </span>
                                </td>
                                <td style={{ padding: '0.875rem 1rem', textAlign: 'right', color: '#6B6B80', fontSize: '0.8rem' }}>
                                    {c.ultima_compra ? new Date(c.ultima_compra).toLocaleDateString('es-AR') : '—'}
                                </td>
                                <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={() => verDetalle(c)}
                                            style={{
                                                background: 'transparent',
                                                border: '1px solid #1E1E2E',
                                                borderRadius: '8px',
                                                padding: '0.3rem 0.75rem',
                                                color: '#6B6B80',
                                                fontSize: '0.78rem',
                                                cursor: 'pointer',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#60A5FA50'; e.currentTarget.style.color = '#60A5FA' }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1E1E2E'; e.currentTarget.style.color = '#6B6B80' }}
                                        >
                                            ver
                                        </button>
                                        <button
                                            onClick={() => abrirEditar(c)}
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
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal nuevo/editar */}
            {modal && (
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
                        maxWidth: '440px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                    }}>
                        <div>
                            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#F0EDE6' }}>
                                {editando ? 'Editar cliente' : 'Nuevo cliente'}
                            </h2>
                            <p style={{ fontSize: '0.78rem', color: '#3A3A4A', marginTop: '0.2rem' }}>
                                {editando ? editando.nombre : 'Completá los datos del cliente'}
                            </p>
                        </div>

                        {[
                            { label: 'Nombre *', key: 'nombre', type: 'text', placeholder: 'Nombre completo' },
                            { label: 'DNI', key: 'dni', type: 'text', placeholder: '12345678' },
                            { label: 'Email', key: 'mail', type: 'email', placeholder: 'cliente@email.com' },
                            { label: 'Teléfono', key: 'telefono', type: 'tel', placeholder: '+54 9 11 1234-5678' },
                        ].map(f => (
                            <div key={f.key}>
                                <label style={labelStyle}>{f.label}</label>
                                <input
                                    type={f.type}
                                    value={(form as any)[f.key]}
                                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                                    placeholder={f.placeholder}
                                    style={inputStyle}
                                    onFocus={e => e.target.style.borderColor = '#F59E0B50'}
                                    onBlur={e => e.target.style.borderColor = '#1E1E2E'}
                                />
                            </div>
                        ))}

                        <div>
                            <label style={labelStyle}>Notas</label>
                            <textarea
                                value={form.notas}
                                onChange={e => setForm({ ...form, notas: e.target.value })}
                                placeholder="Preferencias, alergias, observaciones..."
                                rows={2}
                                style={{ ...inputStyle, resize: 'none' }}
                                onFocus={e => e.target.style.borderColor = '#F59E0B50'}
                                onBlur={e => e.target.style.borderColor = '#1E1E2E'}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                            <button
                                onClick={() => setModal(false)}
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
                                disabled={guardando || !form.nombre.trim()}
                                style={{
                                    flex: 1, padding: '0.75rem',
                                    background: !form.nombre.trim() ? '#16161F' : '#F59E0B',
                                    border: 'none',
                                    borderRadius: '10px',
                                    color: !form.nombre.trim() ? '#2A2A35' : '#0A0A0F',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    cursor: !form.nombre.trim() ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear cliente'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Panel detalle */}
            {detalle && (
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
                        maxWidth: '520px',
                        maxHeight: '80vh',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.25rem',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F0EDE6' }}>{detalle.nombre}</h2>
                                <p style={{ fontSize: '0.78rem', color: '#3A3A4A', marginTop: '0.2rem' }}>
                                    {detalle.dni && `DNI ${detalle.dni} · `}
                                    {detalle.mail && `${detalle.mail} · `}
                                    {detalle.telefono}
                                </p>
                            </div>
                            <button
                                onClick={() => setDetalle(null)}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid #1E1E2E',
                                    borderRadius: '8px',
                                    padding: '0.3rem 0.75rem',
                                    color: '#6B6B80',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Stats del cliente */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                            {[
                                { label: 'Compras', value: detalle.cantidad_compras || 0, color: '#60A5FA' },
                                { label: 'Total gastado', value: fmt(detalle.total_gastado || 0), color: '#F59E0B' },
                                { label: 'Última compra', value: detalle.ultima_compra ? new Date(detalle.ultima_compra).toLocaleDateString('es-AR') : '—', color: '#4ADE80' },
                            ].map(s => (
                                <div key={s.label} style={{
                                    background: '#16161F',
                                    border: '1px solid #1E1E2E',
                                    borderRadius: '12px',
                                    padding: '0.875rem',
                                    textAlign: 'center',
                                }}>
                                    <p style={{ fontSize: '0.68rem', color: '#3A3A4A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>{s.label}</p>
                                    <p style={{ fontSize: '1rem', fontWeight: 700, color: s.color }}>{s.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Historial */}
                        <div>
                            <p style={{ fontSize: '0.72rem', color: '#3A3A4A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                                Últimas compras
                            </p>
                            {historial.length === 0 ? (
                                <p style={{ color: '#2A2A35', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem' }}>
                                    {detalle.dni ? 'Sin compras registradas' : 'Cliente sin DNI — no se puede rastrear historial'}
                                </p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {historial.map(v => (
                                        <div key={v.id} style={{
                                            background: '#16161F',
                                            border: '1px solid #1E1E2E',
                                            borderRadius: '12px',
                                            padding: '0.875rem 1rem',
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '0.8rem', color: '#6B6B80' }}>
                                                    {new Date(v.fecha).toLocaleDateString('es-AR')}
                                                </span>
                                                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#4ADE80' }}>{fmt(v.total)}</span>
                                            </div>
                                            {v.venta_items?.map((item: any) => (
                                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: '0.78rem', color: '#3A3A4A' }}>
                                                        {item.productos?.nombre}
                                                        {item.cantidad > 1 && <span style={{ marginLeft: '0.25rem' }}>×{item.cantidad}</span>}
                                                    </span>
                                                    <span style={{ fontSize: '0.78rem', color: '#F59E0B' }}>{fmt(item.subtotal)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}