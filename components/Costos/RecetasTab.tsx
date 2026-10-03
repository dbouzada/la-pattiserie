'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTema } from '@/lib/theme'

type Unidad = 'g' | 'ml' | 'u'

interface Ingrediente { id: string; nombre: string; unidad_base: Unidad; costo_unitario: number }
interface Producto { id: number; nombre: string; precio_venta: number }
interface Receta {
    id: string
    nombre: string
    categoria: string
    es_preparacion: boolean
    porciones: number
    rendimiento_cantidad: number | null
    rendimiento_unidad: Unidad | null
    mano_obra: number
    packaging: number
    merma_pct: number
    ganancia_pct: number
    precio_venta: number | null
    producto_id: number | null
}
interface CostoReceta {
    id: string
    costo_materia_prima: number
    costo_merma: number
    costo_total: number
    costo_por_porcion: number
    precio_sugerido: number
    margen_real_pct: number | null
}
interface ItemForm { key: string; tipo: 'ing' | 'prep'; ref_id: string; cantidad: string }

const CATEGORIAS = ['Tortas', 'Tartas', 'Budines', 'Galletitas', 'Alfajores', 'Panes', 'Facturas', 'Postres', 'Rellenos y cremas', 'Masas', 'Otros']
const etiquetaUnidad: Record<Unidad, string> = { g: 'g', ml: 'ml', u: 'u' }

const fmt = (n: number, dec = 0) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n)
const num = (s: string) => { const n = parseFloat(String(s).replace(',', '.')); return isNaN(n) ? 0 : n }
const nuevaKey = () => Math.random().toString(36).slice(2)

const formVacio = {
    nombre: '', categoria: 'Otros', porciones: '1',
    es_preparacion: false, rendimiento_cantidad: '', rendimiento_unidad: 'g' as Unidad,
    mano_obra: '0', packaging: '0', merma_pct: '0', ganancia_pct: '50',
    precio_venta: '', producto_id: '' as string,
}

export default function RecetasTab() {
    const { tema } = useTema()
    const [recetas, setRecetas] = useState<Receta[]>([])
    const [costos, setCostos] = useState<Record<string, CostoReceta>>({})
    const [ingredientes, setIngredientes] = useState<Ingrediente[]>([])
    const [productos, setProductos] = useState<Producto[]>([])
    const [loading, setLoading] = useState(true)
    const [busqueda, setBusqueda] = useState('')
    const [modal, setModal] = useState<{ id: string | null } | null>(null)
    const [form, setForm] = useState(formVacio)
    const [items, setItems] = useState<ItemForm[]>([])
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
        const [rec, cos, ing, prod] = await Promise.all([
            supabase.from('recetas').select('*').order('nombre'),
            supabase.from('costo_recetas').select('*'),
            supabase.from('ingredientes').select('id, nombre, unidad_base, costo_unitario').eq('activo', true).order('nombre'),
            supabase.from('productos').select('id, nombre, precio_venta').order('nombre'),
        ])
        setRecetas(rec.data || [])
        setCostos(Object.fromEntries((cos.data || []).map((x: CostoReceta) => [x.id, x])))
        setIngredientes(ing.data || [])
        setProductos(prod.data || [])
        setLoading(false)
    }

    useEffect(() => { cargar() }, [])

    const preparaciones = recetas.filter(r => r.es_preparacion && r.id !== modal?.id)

    // Costo por g/ml/u de una preparación (materia prima + merma) / rendimiento
    const costoUnitarioPrep = (id: string) => {
        const r = recetas.find(x => x.id === id)
        const k = costos[id]
        if (!r || !k || !r.rendimiento_cantidad) return 0
        return (Number(k.costo_materia_prima) + Number(k.costo_merma)) / Number(r.rendimiento_cantidad)
    }

    const infoItem = (it: ItemForm) => {
        if (it.tipo === 'ing') {
            const i = ingredientes.find(x => x.id === it.ref_id)
            return { unidad: i?.unidad_base ?? 'g', costoU: Number(i?.costo_unitario ?? 0) }
        }
        const r = recetas.find(x => x.id === it.ref_id)
        return { unidad: (r?.rendimiento_unidad ?? 'g') as Unidad, costoU: costoUnitarioPrep(it.ref_id) }
    }

    // Cálculo en vivo (misma fórmula que la vista costo_recetas)
    const materiaPrima = items.reduce((s, it) => s + num(it.cantidad) * infoItem(it).costoU, 0)
    const costoTotal = materiaPrima * (1 + num(form.merma_pct) / 100) + num(form.mano_obra) + num(form.packaging)
    const porciones = Math.max(1, Math.round(num(form.porciones)))
    const costoUnidad = costoTotal / porciones
    const precioSugerido = costoUnidad * (1 + num(form.ganancia_pct) / 100)
    const precioVenta = num(form.precio_venta)
    const margenReal = precioVenta > 0 ? ((precioVenta - costoUnidad) / precioVenta) * 100 : null

    const abrirNueva = () => {
        setForm(formVacio); setItems([]); setError(''); setModal({ id: null })
    }

    const abrirEditar = async (r: Receta) => {
        setForm({
            nombre: r.nombre, categoria: r.categoria, porciones: String(r.porciones),
            es_preparacion: r.es_preparacion,
            rendimiento_cantidad: r.rendimiento_cantidad ? String(r.rendimiento_cantidad) : '',
            rendimiento_unidad: r.rendimiento_unidad ?? 'g',
            mano_obra: String(r.mano_obra), packaging: String(r.packaging),
            merma_pct: String(r.merma_pct), ganancia_pct: String(r.ganancia_pct),
            precio_venta: r.precio_venta ? String(r.precio_venta) : '',
            producto_id: r.producto_id ? String(r.producto_id) : '',
        })
        const { data } = await supabase.from('receta_items').select('*').eq('receta_id', r.id)
        setItems((data || []).map(d => ({
            key: nuevaKey(),
            tipo: d.ingrediente_id ? 'ing' : 'prep',
            ref_id: d.ingrediente_id ?? d.preparacion_id,
            cantidad: String(d.cantidad),
        })))
        setError('')
        setModal({ id: r.id })
    }

    const agregarItem = () => {
        if (ingredientes.length === 0) { setError('Primero cargá ingredientes en la pestaña Ingredientes.'); return }
        setItems([...items, { key: nuevaKey(), tipo: 'ing', ref_id: ingredientes[0].id, cantidad: '' }])
    }

    const cambiarItem = (key: string, cambios: Partial<ItemForm>) =>
        setItems(items.map(it => it.key === key ? { ...it, ...cambios } : it))

    const elegirProducto = (id: string) => {
        const p = productos.find(x => String(x.id) === id)
        setForm(f => ({
            ...f,
            producto_id: id,
            precio_venta: p ? String(p.precio_venta) : f.precio_venta,
        }))
    }

    const guardar = async () => {
        if (!form.nombre.trim()) { setError('Poné un nombre a la receta.'); return }
        if (form.es_preparacion && num(form.rendimiento_cantidad) <= 0) {
            setError('Indicá cuánto rinde la preparación (ej: 1200 g).'); return
        }
        const validos = items.filter(it => it.ref_id && num(it.cantidad) > 0)
        setGuardando(true)

        const payload = {
            nombre: form.nombre.trim(),
            categoria: form.categoria,
            porciones,
            es_preparacion: form.es_preparacion,
            rendimiento_cantidad: form.es_preparacion ? num(form.rendimiento_cantidad) : null,
            rendimiento_unidad: form.es_preparacion ? form.rendimiento_unidad : null,
            mano_obra: num(form.mano_obra),
            packaging: num(form.packaging),
            merma_pct: num(form.merma_pct),
            ganancia_pct: num(form.ganancia_pct),
            precio_venta: precioVenta > 0 ? precioVenta : null,
            producto_id: form.producto_id ? Number(form.producto_id) : null,
        }

        let recetaId = modal?.id
        if (recetaId) {
            const { error } = await supabase.from('recetas').update(payload).eq('id', recetaId)
            if (error) { setGuardando(false); setError('No se pudo guardar la receta.'); return }
            await supabase.from('receta_items').delete().eq('receta_id', recetaId)
        } else {
            const { data, error } = await supabase.from('recetas').insert(payload).select('id').single()
            if (error || !data) { setGuardando(false); setError('No se pudo guardar la receta.'); return }
            recetaId = data.id
        }

        if (validos.length > 0) {
            const { error } = await supabase.from('receta_items').insert(validos.map(it => ({
                receta_id: recetaId,
                ingrediente_id: it.tipo === 'ing' ? it.ref_id : null,
                preparacion_id: it.tipo === 'prep' ? it.ref_id : null,
                cantidad: num(it.cantidad),
            })))
            if (error) { setGuardando(false); setError('Se guardó la receta pero no los ingredientes. Probá de nuevo.'); return }
        }

        setGuardando(false)
        setModal(null)
        cargar()
    }

    const eliminar = async (r: Receta) => {
        if (!confirm(`¿Eliminar "${r.nombre}"?`)) return
        const { error } = await supabase.from('recetas').delete().eq('id', r.id)
        if (error) alert('No se puede eliminar: esta preparación se usa en otra receta. Sacala de esa receta primero.')
        cargar()
    }

    const filtradas = recetas.filter(r => r.nombre.toLowerCase().includes(busqueda.toLowerCase()))

    const inputStyle = {
        width: '100%', background: c.input, border: `1px solid ${c.border}`,
        borderRadius: '10px', padding: '0.65rem 0.9rem', color: c.text,
        fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' as const,
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
    const colorMargen = (m: number) => m >= 50 ? '#4ADE80' : m >= 35 ? '#C9A96E' : '#F87171'

    if (loading) return <div style={{ color: c.muted2, fontSize: '0.9rem', textAlign: 'center', padding: '3rem 0' }}>Cargando...</div>

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <style>{`
        .rec-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        @media (max-width: 720px) { .col-opt { display: none; } }
      `}</style>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <input
                    type="text" placeholder="Buscar receta..." value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    style={{ ...inputStyle, flex: 1, minWidth: '180px', padding: '0.5rem 1rem', fontSize: '0.85rem', background: c.card }}
                />
                <button onClick={abrirNueva} style={{
                    background: '#C9A96E', color: '#0F1A09', border: 'none', borderRadius: '10px',
                    padding: '0.5rem 1.1rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                    + Nueva receta
                </button>
            </div>

            {filtradas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: c.muted, fontSize: '0.85rem' }}>
                    {recetas.length === 0 ? 'Todavía no cargaste recetas.' : 'No hay recetas que coincidan.'}
                </div>
            ) : (
                <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '16px', overflow: 'hidden', overflowX: 'auto' }}>
                    <table className="rec-table">
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                                <th style={{ ...th, textAlign: 'left' }}>Receta</th>
                                <th style={{ ...th, textAlign: 'right' }}>Costo total</th>
                                <th className="col-opt" style={{ ...th, textAlign: 'right' }}>Por porción</th>
                                <th className="col-opt" style={{ ...th, textAlign: 'right' }}>Sugerido</th>
                                <th style={{ ...th, textAlign: 'right' }}>Venta</th>
                                <th className="col-opt" style={{ ...th, textAlign: 'right' }}>Margen</th>
                                <th style={th}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtradas.map((r, idx) => {
                                const k = costos[r.id]
                                return (
                                    <tr key={r.id} style={{ borderBottom: idx < filtradas.length - 1 ? `1px solid ${c.border}` : 'none' }}>
                                        <td style={{ padding: '0.875rem 1rem' }}>
                                            <div style={{ color: c.text, fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {r.nombre}
                                                {r.es_preparacion && (
                                                    <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.5rem', borderRadius: '6px', background: '#60A5FA20', color: '#60A5FA' }}>
                                                        preparación
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ color: c.muted2, fontSize: '0.75rem' }}>
                                                {r.categoria} · {r.es_preparacion
                                                    ? `rinde ${Number(r.rendimiento_cantidad)} ${r.rendimiento_unidad}`
                                                    : `${r.porciones} ${r.porciones === 1 ? 'porción' : 'porciones'}`}
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem', textAlign: 'right', color: c.text }}>{k ? fmt(Number(k.costo_total)) : '—'}</td>
                                        <td className="col-opt" style={{ padding: '0.875rem 1rem', textAlign: 'right', color: c.muted }}>{k ? fmt(Number(k.costo_por_porcion)) : '—'}</td>
                                        <td className="col-opt" style={{ padding: '0.875rem 1rem', textAlign: 'right', color: c.muted }}>{k ? fmt(Number(k.precio_sugerido)) : '—'}</td>
                                        <td style={{ padding: '0.875rem 1rem', textAlign: 'right', color: '#C9A96E', fontWeight: 600 }}>
                                            {r.precio_venta ? fmt(Number(r.precio_venta)) : '—'}
                                        </td>
                                        <td className="col-opt" style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                                            {k?.margen_real_pct != null
                                                ? <span style={{ color: colorMargen(Number(k.margen_real_pct)), fontWeight: 500 }}>{Number(k.margen_real_pct).toFixed(0)}%</span>
                                                : <span style={{ color: c.muted2 }}>—</span>}
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                            <button onClick={() => abrirEditar(r)} style={btnSec}>Editar</button>
                                            <button onClick={() => eliminar(r)} style={{ ...btnSec, marginLeft: '0.5rem', color: '#F87171' }}>Eliminar</button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {modal && (
                <div onClick={() => setModal(null)} style={{
                    position: 'fixed', inset: 0, background: '#00000080', display: 'flex',
                    alignItems: 'flex-start', justifyContent: 'center', zIndex: 50, padding: '1rem',
                    backdropFilter: 'blur(4px)', overflowY: 'auto',
                }}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: c.card, border: `1px solid ${c.border}`, borderRadius: '20px',
                        padding: '1.5rem', width: '100%', maxWidth: '620px', margin: '2rem 0',
                        display: 'flex', flexDirection: 'column', gap: '1rem',
                    }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: c.text }}>
                            {modal.id ? 'Editar receta' : 'Nueva receta'}
                        </h2>

                        <div>
                            <label style={labelStyle}>Nombre</label>
                            <input style={inputStyle} value={form.nombre} autoFocus placeholder="Ej: Torta húmeda de chocolate"
                                onChange={e => setForm({ ...form, nombre: e.target.value })} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                            <div>
                                <label style={labelStyle}>Categoría</label>
                                <select style={inputStyle} value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
                                    {CATEGORIAS.map(x => <option key={x}>{x}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Unidades que rinde</label>
                                <input style={inputStyle} inputMode="numeric" value={form.porciones}
                                    onChange={e => setForm({ ...form, porciones: e.target.value })} />
                            </div>
                        </div>

                        {/* Preparación */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: c.text, fontSize: '0.85rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={form.es_preparacion}
                                onChange={e => setForm({ ...form, es_preparacion: e.target.checked })}
                                style={{ accentColor: '#C9A96E', width: '16px', height: '16px' }} />
                            Es una preparación (se puede usar dentro de otras recetas)
                        </label>

                        {form.es_preparacion && (
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={labelStyle}>Rinde</label>
                                    <input style={inputStyle} inputMode="decimal" placeholder="1200" value={form.rendimiento_cantidad}
                                        onChange={e => setForm({ ...form, rendimiento_cantidad: e.target.value })} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Unidad</label>
                                    <select style={inputStyle} value={form.rendimiento_unidad}
                                        onChange={e => setForm({ ...form, rendimiento_unidad: e.target.value as Unidad })}>
                                        <option value="g">g</option>
                                        <option value="ml">ml</option>
                                        <option value="u">unidades</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Ingredientes de la receta */}
                        <div>
                            <label style={labelStyle}>Ingredientes de la receta</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {items.length === 0 && (
                                    <p style={{ color: c.muted2, fontSize: '0.82rem' }}>Todavía no sumaste ingredientes.</p>
                                )}
                                {items.map(it => {
                                    const { unidad, costoU } = infoItem(it)
                                    const subtotal = num(it.cantidad) * costoU
                                    return (
                                        <div key={it.key} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 28px', gap: '0.5rem', alignItems: 'center' }}>
                                            <select style={inputStyle} value={`${it.tipo}:${it.ref_id}`}
                                                onChange={e => {
                                                    const [tipo, ref_id] = e.target.value.split(':')
                                                    cambiarItem(it.key, { tipo: tipo as 'ing' | 'prep', ref_id })
                                                }}>
                                                <optgroup label="Ingredientes">
                                                    {ingredientes.map(i => <option key={i.id} value={`ing:${i.id}`}>{i.nombre}</option>)}
                                                </optgroup>
                                                {preparaciones.length > 0 && (
                                                    <optgroup label="Preparaciones">
                                                        {preparaciones.map(p => <option key={p.id} value={`prep:${p.id}`}>{p.nombre}</option>)}
                                                    </optgroup>
                                                )}
                                            </select>
                                            <div style={{ position: 'relative' }}>
                                                <input style={{ ...inputStyle, paddingRight: '2rem' }} inputMode="decimal" placeholder="0" value={it.cantidad}
                                                    onChange={e => cambiarItem(it.key, { cantidad: e.target.value })} />
                                                <span style={{ position: 'absolute', right: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: c.muted2, fontSize: '0.78rem' }}>
                                                    {etiquetaUnidad[unidad]}
                                                </span>
                                            </div>
                                            <span style={{ color: c.muted, fontSize: '0.82rem', textAlign: 'right' }}>{fmt(subtotal)}</span>
                                            <button onClick={() => setItems(items.filter(x => x.key !== it.key))}
                                                aria-label="Quitar ingrediente"
                                                style={{ background: 'transparent', border: 'none', color: '#F87171', cursor: 'pointer', fontSize: '1rem' }}>
                                                ✕
                                            </button>
                                        </div>
                                    )
                                })}
                                <button onClick={agregarItem} style={{
                                    border: `1px dashed ${c.border}`, background: 'transparent', color: '#C9A96E',
                                    borderRadius: '10px', padding: '0.6rem', fontSize: '0.85rem', cursor: 'pointer',
                                }}>
                                    + Agregar ingrediente
                                </button>
                            </div>
                        </div>

                        {/* Otros costos */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem' }}>
                            <div>
                                <label style={labelStyle}>Mano de obra $</label>
                                <input style={inputStyle} inputMode="decimal" value={form.mano_obra}
                                    onChange={e => setForm({ ...form, mano_obra: e.target.value })} />
                            </div>
                            <div>
                                <label style={labelStyle}>Packaging $</label>
                                <input style={inputStyle} inputMode="decimal" value={form.packaging}
                                    onChange={e => setForm({ ...form, packaging: e.target.value })} />
                            </div>
                            <div>
                                <label style={labelStyle}>Merma %</label>
                                <input style={inputStyle} inputMode="decimal" value={form.merma_pct}
                                    onChange={e => setForm({ ...form, merma_pct: e.target.value })} />
                            </div>
                            <div>
                                <label style={labelStyle}>Ganancia %</label>
                                <input style={inputStyle} inputMode="decimal" value={form.ganancia_pct}
                                    onChange={e => setForm({ ...form, ganancia_pct: e.target.value })} />
                            </div>
                        </div>

                        {/* Venta */}
                        {!form.es_preparacion && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={labelStyle}>Producto vinculado</label>
                                    <select style={inputStyle} value={form.producto_id} onChange={e => elegirProducto(e.target.value)}>
                                        <option value="">Ninguno</option>
                                        {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Precio de venta $</label>
                                    <input
                                        style={{ ...inputStyle, opacity: form.producto_id ? 0.6 : 1, cursor: form.producto_id ? 'not-allowed' : 'text' }}
                                        inputMode="decimal" placeholder="0" value={form.precio_venta}
                                        disabled={!!form.producto_id}
                                        onChange={e => setForm({ ...form, precio_venta: e.target.value })} />
                                    {form.producto_id && (
                                        <p style={{ color: c.muted2, fontSize: '0.72rem', marginTop: '0.3rem' }}>
                                            Se edita desde Productos
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Resumen */}
                        <div style={{ background: c.card2, borderRadius: '12px', padding: '0.9rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.86rem' }}>
                            {[
                                ['Materia prima', fmt(materiaPrima)],
                                ['Costo total', fmt(costoTotal)],
                                ...(porciones > 1 ? [['Costo por unidad', fmt(costoUnidad)]] : []),
                            ].map(([k, v]) => (
                                <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: c.muted }}>{k}</span>
                                    <span style={{ color: c.text, fontWeight: k === 'Costo total' ? 600 : 400 }}>{v}</span>
                                </div>
                            ))}
                            {!form.es_preparacion && (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: c.muted }}>Precio sugerido por unidad</span>
                                        <span style={{ color: '#C9A96E', fontWeight: 600 }}>{fmt(precioSugerido)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: c.muted }}>Margen real</span>
                                        <span style={{ color: margenReal !== null ? colorMargen(margenReal) : c.muted2, fontWeight: 600 }}>
                                            {margenReal !== null ? `${margenReal.toFixed(1)}%` : '—'}
                                        </span>
                                    </div>
                                </>
                            )}
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
                                {guardando ? 'Guardando...' : 'Guardar receta'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}