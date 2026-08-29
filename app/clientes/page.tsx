'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Cliente {
    id: number
    nombre: string
    empresa: string | null
    mail: string | null
    telefono: string | null
    notas: string | null
}

const clienteVacio = {
    nombre: '',
    empresa: '',
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

    const cargar = async () => {
        const { data } = await supabase
            .from('clientes')
            .select('id, nombre, empresa, mail, telefono, notas')
            .order('nombre')
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
            empresa: c.empresa || '',
            mail: c.mail || '',
            telefono: c.telefono || '',
            notas: c.notas || '',
        })
        setModal(true)
    }

    const guardar = async () => {
        if (!form.nombre.trim()) return
        setGuardando(true)

        const payload = {
            nombre: form.nombre,
            empresa: form.empresa || null,
            mail: form.mail || null,
            telefono: form.telefono || null,
            notas: form.notas || null,
        }

        if (editando) {
            await supabase.from('clientes').update(payload).eq('id', editando.id)
        } else {
            await supabase.from('clientes').insert(payload)
        }

        await cargar()
        setModal(false)
        setGuardando(false)
    }

    const eliminar = async (id: number) => {
        if (!confirm('¿Eliminar este cliente?')) return
        await supabase.from('clientes').delete().eq('id', id)
        await cargar()
    }

    const filtrados = clientes.filter(c =>
        c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.empresa?.toLowerCase().includes(busqueda.toLowerCase()) ||
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
                        placeholder="Buscar..."
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
                            width: '240px',
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
                        + Nuevo
                    </button>
                </div>
            </div>

            {/* Tabla */}
            <div style={{ background: '#0F0F18', border: '1px solid #1E1E2E', borderRadius: '16px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #1E1E2E' }}>
                            {['Nombre', 'Empresa', 'Mail', 'Teléfono', 'Notas', ''].map(h => (
                                <th key={h} style={{
                                    padding: '0.875rem 1rem',
                                    textAlign: 'left',
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
                                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#2A2A35' }}>
                                    {busqueda ? 'Sin resultados' : 'Sin clientes registrados'}
                                </td>
                            </tr>
                        )}
                        {filtrados.map((c, i) => (
                            <tr key={c.id} style={{ borderBottom: i < filtrados.length - 1 ? '1px solid #1E1E2E' : 'none' }}>
                                <td style={{ padding: '0.875rem 1rem', color: '#E8E6E0', fontWeight: 500 }}>{c.nombre}</td>
                                <td style={{ padding: '0.875rem 1rem', color: '#6B6B80' }}>{c.empresa || '—'}</td>
                                <td style={{ padding: '0.875rem 1rem', color: '#6B6B80' }}>
                                    {c.mail ? (
                                        <a href={`mailto:${c.mail}`} style={{ color: '#60A5FA', textDecoration: 'none' }}>{c.mail}</a>
                                    ) : '—'}
                                </td>
                                <td style={{ padding: '0.875rem 1rem', color: '#6B6B80' }}>{c.telefono || '—'}</td>
                                <td style={{ padding: '0.875rem 1rem', color: '#3A3A4A', fontSize: '0.8rem' }}>{c.notas || '—'}</td>
                                <td style={{ padding: '0.875rem 1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                                        <button
                                            onClick={() => eliminar(c.id)}
                                            style={{
                                                background: 'transparent',
                                                border: '1px solid #1E1E2E',
                                                borderRadius: '8px',
                                                padding: '0.3rem 0.75rem',
                                                color: '#6B6B80',
                                                fontSize: '0.78rem',
                                                cursor: 'pointer',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#F8717150'; e.currentTarget.style.color = '#F87171' }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1E1E2E'; e.currentTarget.style.color = '#6B6B80' }}
                                        >
                                            eliminar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
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
                        maxWidth: '420px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                    }}>
                        <div>
                            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#F0EDE6' }}>
                                {editando ? 'Editar cliente' : 'Nuevo cliente'}
                            </h2>
                        </div>

                        {[
                            { label: 'Nombre *', key: 'nombre', type: 'text', placeholder: 'Nombre completo' },
                            { label: 'Empresa', key: 'empresa', type: 'text', placeholder: 'Nombre de la empresa' },
                            { label: 'Mail', key: 'mail', type: 'email', placeholder: 'cliente@email.com' },
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
                                placeholder="Preferencias, observaciones..."
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
                                {guardando ? 'Guardando...' : editando ? 'Guardar' : 'Crear'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}