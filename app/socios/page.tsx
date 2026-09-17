'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTema } from '@/lib/theme'

interface Socio {
    numero_socio: number
    nombre: string
    mail: string | null
    telefono: string | null
    direccion: string | null
    observaciones: string | null
    activo: boolean
    created_at: string
}

const socioVacio = {
    nombre: '',
    mail: '',
    telefono: '',
    direccion: '',
    observaciones: '',
}

export default function Socios() {
    const { tema } = useTema()
    const [socios, setSocios] = useState<Socio[]>([])
    const [loading, setLoading] = useState(true)
    const [busqueda, setBusqueda] = useState('')
    const [modal, setModal] = useState(false)
    const [editando, setEditando] = useState<Socio | null>(null)
    const [form, setForm] = useState(socioVacio)
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
            .from('socios')
            .select('*')
            .order('numero_socio', { ascending: true })
        setSocios(data || [])
        setLoading(false)
    }

    useEffect(() => { cargar() }, [])

    const abrirNuevo = () => {
        setEditando(null)
        setForm(socioVacio)
        setModal(true)
    }

    const abrirEditar = (s: Socio) => {
        setEditando(s)
        setForm({
            nombre: s.nombre,
            mail: s.mail || '',
            telefono: s.telefono || '',
            direccion: s.direccion || '',
            observaciones: s.observaciones || '',
        })
        setModal(true)
    }

    const guardar = async () => {
        if (!form.nombre.trim()) return
        setGuardando(true)
        const payload = {
            nombre: form.nombre,
            mail: form.mail || null,
            telefono: form.telefono || null,
            direccion: form.direccion || null,
            observaciones: form.observaciones || null,
        }
        if (editando) {
            await supabase.from('socios').update(payload).eq('numero_socio', editando.numero_socio)
        } else {
            await supabase.from('socios').insert(payload)
        }
        await cargar()
        setModal(false)
        setGuardando(false)
    }

    const toggleActivo = async (s: Socio) => {
        await supabase.from('socios').update({ activo: !s.activo }).eq('numero_socio', s.numero_socio)
        await cargar()
    }

    const filtrados = socios.filter(s =>
        s.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.mail?.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.telefono?.includes(busqueda) ||
        s.numero_socio.toString().includes(busqueda)
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
        .socios-col-dir, .socios-col-obs { display: table-cell; }
        @media (max-width: 768px) {
          .socios-col-dir, .socios-col-obs { display: none; }
        }
      `}</style>

            <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: c.text, letterSpacing: '-0.03em' }}>Club de Socios</h1>
                        <p style={{ fontSize: '0.8rem', color: c.muted, marginTop: '0.2rem' }}>
                            {socios.length} socios · {socios.filter(s => s.activo).length} activos
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <input
                            type="text"
                            placeholder="Buscar por nombre, mail, N° socio..."
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                            style={{
                                background: c.card, border: `1px solid ${c.border}`,
                                borderRadius: '10px', padding: '0.5rem 1rem',
                                color: c.text, fontSize: '0.85rem', outline: 'none',
                                width: '100%', maxWidth: '260px', boxSizing: 'border-box' as const,
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
                            + Nuevo socio
                        </button>
                    </div>
                </div>

                {/* KPIs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    {[
                        { label: 'Total socios', value: socios.length, color: '#C9A96E', bg: '#C9A96E10', border: '#C9A96E25' },
                        { label: 'Activos', value: socios.filter(s => s.activo).length, color: '#4ADE80', bg: '#4ADE8010', border: '#4ADE8025' },
                        { label: 'Inactivos', value: socios.filter(s => !s.activo).length, color: '#F87171', bg: '#F8717110', border: '#F8717125' },
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
                <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '16px', overflow: 'hidden', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.72rem', color: c.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, whiteSpace: 'nowrap' }}>N° Socio</th>
                                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.72rem', color: c.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Nombre</th>
                                <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.72rem', color: c.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Contacto</th>
                                <th className="socios-col-dir" style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.72rem', color: c.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Dirección</th>
                                <th className="socios-col-obs" style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.72rem', color: c.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Observaciones</th>
                                <th style={{ padding: '0.875rem 1rem', textAlign: 'center', fontSize: '0.72rem', color: c.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Estado</th>
                                <th style={{ padding: '0.875rem 1rem' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtrados.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: c.muted2 }}>
                                        {busqueda ? 'Sin resultados' : 'Sin socios registrados'}
                                    </td>
                                </tr>
                            )}
                            {filtrados.map((s, i) => (
                                <tr key={s.numero_socio} style={{
                                    borderBottom: i < filtrados.length - 1 ? `1px solid ${c.border}` : 'none',
                                    opacity: s.activo ? 1 : 0.5,
                                }}>
                                    <td style={{ padding: '0.875rem 1rem' }}>
                                        <span style={{
                                            fontSize: '0.85rem', fontWeight: 700, color: '#C9A96E',
                                            background: '#C9A96E15', padding: '0.2rem 0.6rem',
                                            borderRadius: '6px',
                                        }}>
                                            #{s.numero_socio.toString().padStart(4, '0')}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.875rem 1rem', color: c.text, fontWeight: 500, whiteSpace: 'nowrap' }}>{s.nombre}</td>
                                    <td style={{ padding: '0.875rem 1rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                            {s.mail && <a href={`mailto:${s.mail}`} style={{ color: '#60A5FA', textDecoration: 'none', fontSize: '0.8rem' }}>{s.mail}</a>}
                                            {s.telefono && <span style={{ color: c.muted, fontSize: '0.8rem' }}>{s.telefono}</span>}
                                            {!s.mail && !s.telefono && <span style={{ color: c.muted2 }}>—</span>}
                                        </div>
                                    </td>
                                    <td className="socios-col-dir" style={{ padding: '0.875rem 1rem', color: c.muted, fontSize: '0.8rem', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {s.direccion || '—'}
                                    </td>
                                    <td className="socios-col-obs" style={{ padding: '0.875rem 1rem', color: c.muted, fontSize: '0.8rem', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {s.observaciones || '—'}
                                    </td>
                                    <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                                        <button
                                            onClick={() => toggleActivo(s)}
                                            style={{
                                                fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '6px',
                                                background: s.activo ? '#4ADE8015' : c.card2,
                                                color: s.activo ? '#4ADE80' : c.muted,
                                                border: 'none', cursor: 'pointer', fontWeight: 500,
                                            }}
                                        >
                                            {s.activo ? 'activo' : 'inactivo'}
                                        </button>
                                    </td>
                                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                                        <button
                                            onClick={() => abrirEditar(s)}
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
                            width: '100%', maxWidth: '440px',
                            display: 'flex', flexDirection: 'column', gap: '1rem',
                            maxHeight: '90vh', overflowY: 'auto',
                        }}>
                            <div>
                                <h2 style={{ fontSize: '1rem', fontWeight: 600, color: c.text }}>
                                    {editando ? `Editar socio #${editando.numero_socio.toString().padStart(4, '0')}` : 'Nuevo socio'}
                                </h2>
                                {!editando && (
                                    <p style={{ fontSize: '0.78rem', color: c.muted, marginTop: '0.2rem' }}>
                                        El número de socio se asigna automáticamente
                                    </p>
                                )}
                            </div>

                            {[
                                { label: 'Nombre y apellido *', key: 'nombre', type: 'text', placeholder: 'Nombre completo' },
                                { label: 'Mail', key: 'mail', type: 'email', placeholder: 'socio@email.com' },
                                { label: 'Teléfono', key: 'telefono', type: 'tel', placeholder: '+54 9 11 1234-5678' },
                                { label: 'Dirección', key: 'direccion', type: 'text', placeholder: 'Calle, número, ciudad' },
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
                                <label style={labelStyle}>Observaciones</label>
                                <textarea
                                    value={form.observaciones}
                                    onChange={e => setForm({ ...form, observaciones: e.target.value })}
                                    placeholder="Preferencias, alergias, notas..."
                                    rows={3}
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
                                    {guardando ? 'Guardando...' : editando ? 'Guardar' : 'Crear socio'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}