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
        card: tema === 'oscuro' ? '#162210' : '#F7F3EC',
        card2: tema === 'oscuro' ? '#1E2E14' : '#EDE8DF',
        border: tema === 'oscuro' ? '#2A4A1A' : '#C8BFA8',
        text: tema === 'oscuro' ? '#E8E4D8' : '#1A1A14',
        muted: tema === 'oscuro' ? '#8BAA6E' : '#6B6550',
        muted2: tema === 'oscuro' ? '#4A6A3A' : '#9B9280',
        input: tema === 'oscuro' ? '#1E2E14' : '#F7F3EC',
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

    const abrirEditar = (cl: Cliente) => {
        setEditando(cl)
        setForm({
            nombre: cl.nombre,
            empresa: cl.empresa || '',
            mail: cl.mail || '',
            telefono: cl.telefono || '',
            notas: cl.notas || '',
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
        <>
            <style>{`
        .clientes-col-empresa, .clientes-col-notas { display: table-cell; }
        @media (max-width: 640px) {
          .clientes-col-empresa, .clientes-col-notas { display: none; }
        }
      `}</style>

            <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: c.text, letterSpacing: '-0.03em' }}>Clientes</h1>
                        <p style={{ fontSize: '0.8rem', color: c.muted, marginTop: '0.2rem' }}>{clientes.length} clientes registrados</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
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
                        <button
                            onClick={abrirNuevo}
                            style={{
                                background: '#C9A96E', color: '#0F1A09',
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
                <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '16px', overflow: 'hidden', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.72rem', color: c.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Nombre</th>
                                <th className="clientes-col-empresa" style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.72rem', color: c.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Empresa</th>
                                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.72rem', color: c.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Mail</th>
                                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.72rem', color: c.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Teléfono</th>
                                <th className="clientes-col-notas" style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.72rem', color: c.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Notas</th>
                                <th style={{ padding: '0.875rem 1rem' }}></th>
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
                                    <td style={{ padding: '0.875rem 1rem', color: c.text, fontWeight: 500, whiteSpace: 'nowrap' }}>{cl.nombre}</td>
                                    <td className="clientes-col-empresa" style={{ padding: '0.875rem 1rem', color: c.muted }}>{cl.empresa || '—'}</td>
                                    <td style={{ padding: '0.875rem 1rem' }}>
                                        {cl.mail ? (
                                            <a href={`mailto:${cl.mail}`} style={{ color: '#60A5FA', textDecoration: 'none', fontSize: '0.85rem' }}>{cl.mail}</a>
                                        ) : <span style={{ color: c.muted }}>—</span>}
                                    </td>
                                    <td style={{ padding: '0.875rem 1rem', color: c.muted, whiteSpace: 'nowrap' }}>{cl.telefono || '—'}</td>
                                    <td className="clientes-col-notas" style={{ padding: '0.875rem 1rem', color: c.muted, fontSize: '0.8rem', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cl.notas || '—'}</td>
                                    <td style={{ padding: '0.875rem 1rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => abrirEditar(cl)}
                                                style={{
                                                    background: 'transparent', border: `1px solid ${c.border}`,
                                                    borderRadius: '8px', padding: '0.3rem 0.75rem',
                                                    color: c.muted, fontSize: '0.78rem', cursor: 'pointer',
                                                    whiteSpace: 'nowrap',
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A96E50'; e.currentTarget.style.color = '#C9A96E' }}
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
                                                    whiteSpace: 'nowrap',
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
                            maxHeight: '90vh', overflowY: 'auto',
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
                                        onFocus={e => e.target.style.borderColor = '#C9A96E50'}
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
                                    onFocus={e => e.target.style.borderColor = '#C9A96E50'}
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
                                        background: !form.nombre.trim() ? c.card2 : '#C9A96E',
                                        border: 'none', borderRadius: '10px',
                                        color: !form.nombre.trim() ? c.muted2 : '#0F1A09',
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
        </>
    )
}