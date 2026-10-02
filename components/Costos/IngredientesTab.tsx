'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTema } from '@/lib/theme'

interface Categoria { id: number; nombre: string }
type Unidad = 'g' | 'ml' | 'u'
interface Ingrediente {
    id: string
    nombre: string
    categoria_id: number
    precio_compra: number
    cantidad_compra: number
    unidad_base: Unidad
    costo_unitario: number
}

// Unidad de compra que elige el usuario -> unidad base y factor
const UNIDADES = [
    { id: 'kg', label: 'kg', base: 'g' as Unidad, factor: 1000 },
    { id: 'g', label: 'g', base: 'g' as Unidad, factor: 1 },
    { id: 'l', label: 'litro', base: 'ml' as Unidad, factor: 1000 },
    { id: 'ml', label: 'ml', base: 'ml' as Unidad, factor: 1 },
    { id: 'u', label: 'unidad', base: 'u' as Unidad, factor: 1 },
]

const porUnidad: Record<Unidad, string> = { g: 'por g', ml: 'por ml', u: 'por unidad' }

const fmt = (n: number, dec = 0) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n)

function textoCompra(i: Ingrediente) {
    const q = Number(i.cantidad_compra)
    if (i.unidad_base === 'g' && q % 1000 === 0) return `${q / 1000} kg`
    if (i.unidad_base === 'ml' && q % 1000 === 0) return `${q / 1000} l`
    if (i.unidad_base === 'u') return `${q} ${q === 1 ? 'unidad' : 'unidades'}`
    return `${q} ${i.unidad_base}`
}

function unidadDeEdicion(i: Ingrediente) {
    const q = Number(i.cantidad_compra)
    if (i.unidad_base === 'g') return q % 1000 === 0 ? 'kg' : 'g'
    if (i.unidad_base === 'ml') return q % 1000 === 0 ? 'l' : 'ml'
    return 'u'
}

const formVacio = { nombre: '', categoria_id: 8, precio: '', cantidad: '1', unidad: 'kg' }

export default function IngredientesTab() {
    const { tema } = useTema()
    const [items, setItems] = useState<Ingrediente[]>([])
    const [categorias, setCategorias] = useState<Categoria[]>([])
    const [loading, setLoading] = useState(true)
    const [busqueda, setBusqueda] = useState('')
    const [catFiltro, setCatFiltro] = useState<number | null>(null)
    const [modal, setModal] = useState<{ id: string | null } | null>(null)
    const [form, setForm] = useState(formVacio)
    const [guardando, setGuardando] = useState(false)
    const [error, setError] = useState('')

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
        const [ing, cat] = await Promise.all([
            supabase.from('ingredientes').select('*').eq('activo', true).order('nombre'),
            supabase.from('categorias_ingrediente').select('*').order('id'),
        ])
        setItems(ing.data || [])
        setCategorias(cat.data || [])
        setLoading(false)
    }

    useEffect(() => { cargar() }, [])

    const nombreCat = (id: number) => categorias.find(x => x.id === id)?.nombre ?? 'Otros'

    const filtrados = items.filter(i =>
        (catFiltro === null || i.categoria_id === catFiltro) &&
        i.nombre.toLowerCase().includes(busqueda.toLowerCase())
    )

    const abrirNuevo = () => { setForm(formVacio); setError(''); setModal({ id: null }) }

    const abrirEditar = (i: Ingrediente) => {
        const unidad = unidadDeEdicion(i)
        const factor = UNIDADES.find(u => u.id === unidad)!.factor
        setForm({
            nombre: i.nombre,
            categoria_id: i.categoria_id,
            precio: String(i.precio_compra),
            cantidad: String(Number(i.cantidad_compra) / factor),
            unidad,
        })
        setError('')
        setModal({ id: i.id })
    }

    const u = UNIDADES.find(x => x.id === form.unidad)!
    const precioN = parseFloat(form.precio.replace(',', '.'))
    const cantN = parseFloat(form.cantidad.replace(',', '.'))
    const valido = form.nombre.trim() !== '' && precioN >= 0 && cantN > 0
    const costoPreview = valido ? precioN / (cantN * u.factor) : null

    const guardar = async () => {
        if (!valido) { setError('Completá nombre, precio y cantidad.'); return }
        setGuardando(true)
        const payload = {
            nombre: form.nombre.trim(),
            categoria_id: form.categoria_id,
            precio_compra: precioN,
            cantidad_compra: cantN * u.factor,
            unidad_base: u.base,
        }
        const res = modal?.id
            ? await supabase.from('ingredientes').update(payload).eq('id', modal.id)
            : await supabase.from('ingredientes').insert(payload)
        setGuardando(false)
        if (res.error) { setError('No se pudo guardar. Probá de nuevo.'); return }
        setModal(null)
        cargar()
    }

    // Baja lógica: no rompe recetas que ya lo usan
    const eliminar = async (i: Ingrediente) => {
        if (!confirm(`¿Eliminar "${i.nombre}"?`)) return
        await supabase.from('ingredientes').update({ activo: false }).eq('id', i.id)
        cargar()
    }

    const inputStyle = {
        width: '100%', background: c.input, border: `1px solid ${c.border}`,
        borderRadius: '10px', padding: '0.75rem 1rem', color: c.text,
        fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as const,
    }

    const labelStyle = {
        fontSize: '0.72rem', color: c.muted, display: 'block', marginBottom: '0.375rem',
        textTransform: 'uppercase' as const, letterSpacing: '0.06em',
    }

    const th = {
        padding: '0.875rem 1rem', fontSize: '0.72rem', color: c.muted,
        textTransform: 'uppercase' as const, letterSpacing: '0.06em', fontWeight: 500,
    }

    const btnSec = {
        background: 'transparent', border: `1px solid ${c.border}`, borderRadius: '8px',
        padding: '0.3rem 0.75rem', color: c.muted, fontSize: '0.78rem', cursor: 'pointer',
    }

    if (loading) return <div style={{ color: c.muted2, fontSize: '0.9rem', textAlign: 'center', padding: '3rem 0' }}>Cargando...</div>

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <style>{`
        .ing-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        @media (max-width: 640px) { .col-compra { display: none; } }
      `}</style>

            {/* Buscador + nuevo */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <input
                    type="text"
                    placeholder="Buscar ingrediente..."
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    style={{ ...inputStyle, flex: 1, minWidth: '180px', padding: '0.5rem 1rem', fontSize: '0.85rem', background: c.card }}
                    onFocus={e => e.target.style.borderColor = '#C9A96E50'}
                    onBlur={e => e.target.style.borderColor = c.border}
                />
                <button onClick={abrirNuevo} style={{
                    background: '#C9A96E', color: '#0F1A09', border: 'none', borderRadius: '10px',
                    padding: '0.5rem 1.1rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                    + Nuevo ingrediente
                </button>
            </div>

            {/* Filtro por categoría */}
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                {[{ id: null as number | null, nombre: 'Todas' }, ...categorias].map(cat => {
                    const activo = catFiltro === cat.id
                    return (
                        <button key={cat.id ?? 'todas'} onClick={() => setCatFiltro(cat.id)} style={{
                            padding: '0.3rem 0.8rem', borderRadius: '999px', fontSize: '0.75rem', whiteSpace: 'nowrap',
                            color: activo ? '#C9A96E' : c.muted,
                            background: activo ? '#C9A96E18' : 'transparent',
                            border: `1px solid ${activo ? '#C9A96E35' : c.border}`,
                            cursor: 'pointer',
                        }}>
                            {cat.nombre}
                        </button>
                    )
                })}
            </div>

            {/* Tabla */}
            {filtrados.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: c.muted, fontSize: '0.85rem' }}>
                    {items.length === 0 ? 'Todavía no cargaste ingredientes.' : 'No hay ingredientes que coincidan.'}
                </div>
            ) : (
                <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '16px', overflow: 'hidden', overflowX: 'auto' }}>
                    <table className="ing-table">
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                                <th style={{ ...th, textAlign: 'left' }}>Ingrediente</th>
                                <th className="col-compra" style={{ ...th, textAlign: 'left' }}>Compra</th>
                                <th style={{ ...th, textAlign: 'right' }}>Costo</th>
                                <th style={th}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtrados.map((i, idx) => (
                                <tr key={i.id} style={{ borderBottom: idx < filtrados.length - 1 ? `1px solid ${c.border}` : 'none' }}>
                                    <td style={{ padding: '0.875rem 1rem' }}>
                                        <div style={{ color: c.text, fontWeight: 500 }}>{i.nombre}</div>
                                        <div style={{ color: c.muted2, fontSize: '0.75rem' }}>{nombreCat(i.categoria_id)}</div>
                                    </td>
                                    <td className="col-compra" style={{ padding: '0.875rem 1rem', color: c.muted }}>
                                        {fmt(Number(i.precio_compra))} · {textoCompra(i)}
                                    </td>
                                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                        <span style={{ color: '#C9A96E', fontWeight: 600 }}>{fmt(Number(i.costo_unitario), 2)}</span>
                                        <span style={{ color: c.muted2, fontSize: '0.72rem', marginLeft: '0.3rem' }}>{porUnidad[i.unidad_base]}</span>
                                    </td>
                                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                        <button onClick={() => abrirEditar(i)} style={btnSec}>Editar</button>
                                        <button onClick={() => eliminar(i)} style={{ ...btnSec, marginLeft: '0.5rem', color: '#F87171' }}>Eliminar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal alta / edición */}
            {modal && (
                <div onClick={() => setModal(null)} style={{
                    position: 'fixed', inset: 0, background: '#00000080', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem', backdropFilter: 'blur(4px)',
                }}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: c.card, border: `1px solid ${c.border}`, borderRadius: '20px',
                        padding: '1.5rem', width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '1rem',
                    }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: c.text }}>
                            {modal.id ? 'Editar ingrediente' : 'Nuevo ingrediente'}
                        </h2>

                        <div>
                            <label style={labelStyle}>Nombre</label>
                            <input style={inputStyle} value={form.nombre} autoFocus placeholder="Ej: Manteca"
                                onChange={e => setForm({ ...form, nombre: e.target.value })} />
                        </div>

                        <div>
                            <label style={labelStyle}>Categoría</label>
                            <select style={inputStyle} value={form.categoria_id}
                                onChange={e => setForm({ ...form, categoria_id: Number(e.target.value) })}>
                                {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: '0.5rem' }}>
                            <div>
                                <label style={labelStyle}>Precio</label>
                                <input style={inputStyle} inputMode="decimal" placeholder="1800" value={form.precio}
                                    onChange={e => setForm({ ...form, precio: e.target.value })} />
                            </div>
                            <div>
                                <label style={labelStyle}>Cantidad</label>
                                <input style={inputStyle} inputMode="decimal" value={form.cantidad}
                                    onChange={e => setForm({ ...form, cantidad: e.target.value })} />
                            </div>
                            <div>
                                <label style={labelStyle}>Unidad</label>
                                <select style={inputStyle} value={form.unidad}
                                    onChange={e => setForm({ ...form, unidad: e.target.value })}>
                                    {UNIDADES.map(x => <option key={x.id} value={x.id}>{x.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <div style={{
                            background: c.card2, borderRadius: '10px', padding: '0.75rem 1rem',
                            display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem',
                        }}>
                            <span style={{ color: c.muted }}>Costo {porUnidad[u.base]}</span>
                            <span style={{ color: '#C9A96E', fontWeight: 600 }}>
                                {costoPreview !== null ? fmt(costoPreview, 2) : '—'}
                            </span>
                        </div>

                        {error && <p style={{ color: '#F87171', fontSize: '0.8rem' }}>{error}</p>}

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setModal(null)} style={{ ...btnSec, padding: '0.6rem 1.1rem', fontSize: '0.85rem', borderRadius: '10px' }}>
                                Cancelar
                            </button>
                            <button onClick={guardar} disabled={guardando} style={{
                                background: '#C9A96E', color: '#0F1A09', border: 'none', borderRadius: '10px',
                                padding: '0.6rem 1.1rem', fontSize: '0.85rem', fontWeight: 600,
                                cursor: 'pointer', opacity: guardando ? 0.6 : 1,
                            }}>
                                {guardando ? 'Guardando...' : 'Guardar ingrediente'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}