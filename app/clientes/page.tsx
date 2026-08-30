'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTema } from '@/lib/theme'

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
    const { tema } = useTema()
    const [clientes, setClientes] = useState<Cliente[]>([])
    const [loading, setLoading] = useState(true)
    const [busqueda, setBusqueda] = useState('')
    const [modal, setModal] = useState(false)
    const [editando, setEditando] = useState<Cliente | null>(null)
    const [form, setForm] = useState(clienteVacio)
    const [guardando, setGuardando] = useState(false)

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

    const filtrados = clientes.filter(cl =>
        cl.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        cl.empresa?.toLowerCase().includes(busqueda.toLowerCase()) ||
        cl.mail?.toLowerCase().includes(busqueda.toLowerCase()) ||
        cl.telefono?.includes(busqueda)
    )

    const inputStyle = {
        width: '100%',
        background: c.input,
        border: `1px solid ${c.border}`,
        borderRadius: '10px',
        padding: '0.75rem 1rem',
        color: c.text,
        fontSize: '0.9rem',
        outline: 'none',
        boxSizing: 'border-box' as const,
        fontFamily: 'inherit',
    }

    const labelStyle = {
        fontSize: '0.72rem',
        color: c.muted,
        display: 'block',
        marginBottom: '0.375rem',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.06em',
    }

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <div style={{ color: c.muted2, fontSize: '0.9rem' }}>Cargando...</div>
        </div>
    )

    return (
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: c.text, letterSpacing: '-0.03em' }}>Clientes</h1>
                    <p style={{ fontSize: '0.8rem', color: c.muted, marginTop: '0.2rem' }}>{clientes.length} clientes registrados</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        style={{
                            background: c.card, border: `1px solid ${c.border}`,
                            borderRadius: '10px', padding: '0.5rem 1rem',
                            color: c.text, fontSize: '0.85rem', outline: 'none', width: '240px',
                        }}
                        onFocus={e => e.target.style.borderColor = '#F59E0B50'}
                        onBlur={e => e.target.style.borderColor = c.border}
                    />
                    <button
                        onClick={abrirNuevo}
                        style={{
                            background: '#F59E0B', color: '#0A0A0F',
                            border: 'none', borderRadius: '10px',
                            padding: '0.5rem 1.1rem', fontSize: '0.85rem',
                            fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                        }}
                    >
                        + Nuevo
                    </button>
                </div>
            </div>

            {/* Tabla */}
            <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '16px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                        <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                            {['Nombre', 'Empresa', 'Mail', 'Teléfono', 'Notas', ''].map(h => (
                                <th key={h} style={{
                                    padding: '0.875rem 1rem', textAlign: 'left',
                                    fontSize: '0.72rem', color: c.muted,
                                    textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500,
                                }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtrados.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: c.muted2 }}>
                                    {busqueda ? 'Sin resultados' : 'Sin clientes registrados'}
                                </td>
                            </tr>
                        )}
                        {filtrados.map((cl, i) => (
                            <tr key={cl.id} style={{ borderBottom: i < filtrados.length - 1 ? `1px solid ${c.border}` : 'none' }}>
                                <td style={{ padding: '0.875rem 1rem', color: c.text, fontWeight: 500 }}>{cl.nombre}</td>
                                <td style={{ padding: '0.875rem 1rem', color: c.muted }}>{cl.empresa || '—'}</td>
                                <td style={{ padding: '0.875rem 1rem' }}>
                                    {cl.mail ? (
                                        <a href={`mailto:${cl.mail}`} style={{ color: '#60A5FA', textDecoration: 'none' }}>{cl.mail}</a>
                                    ) : <span style={{ color: c.muted }}>—</span>}
                                </td>
                                <td style={{ padding: '0.875rem 1rem', color: c.muted }}>{cl.telefono || '—'}</td>
                                <td style={{ padding: '0.875rem 1rem', color: c.muted, fontSize: '0.8rem' }}>{cl.notas || '—'}</td>
                                <td style={{ padding: '0.875rem 1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => abrirEditar(cl)}
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
                                        <button
                                            onClick={() => eliminar(cl.id)}
                                            style={{
                                                background: 'transparent', border: `1px solid ${c.border}`,
                                                borderRadius: '8px', padding: '0.3rem 0.75rem',
                                                color: c.muted, fontSize: '0.78rem', cursor: 'pointer',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#F8717150'; e.currentTarget.style.color = '#F87171' }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.muted }}
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
                        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: c.text }}>
                            {editando ? 'Editar cliente' : 'Nuevo cliente'}
                        </h2>

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
                                    onBlur={e => e.target.style.borderColor = c.border}
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
                                onBlur={e => e.target.style.borderColor = c.border}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                            <button
                                onClick={() => setModal(false)}
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
                                disabled={guardando || !form.nombre.trim()}
                                style={{
                                    flex: 1, padding: '0.75rem',
                                    background: !form.nombre.trim() ? c.card2 : '#F59E0B',
                                    border: 'none', borderRadius: '10px',
                                    color: !form.nombre.trim() ? c.muted2 : '#0A0A0F',
                                    fontSize: '0.875rem', fontWeight: 600,
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