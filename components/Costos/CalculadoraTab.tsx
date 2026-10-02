'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTema } from '@/lib/theme'

type Unidad = 'g' | 'ml' | 'u'

interface Receta {
    id: string
    nombre: string
    es_preparacion: boolean
    porciones: number
    rendimiento_cantidad: number | null
    rendimiento_unidad: Unidad | null
    mano_obra: number
    packaging: number
    merma_pct: number
    ganancia_pct: number
}
interface Item { ingrediente_id: string | null; preparacion_id: string | null; cantidad: number }
interface Ingrediente { id: string; nombre: string; unidad_base: Unidad; costo_unitario: number }
interface Costo { id: string; costo_materia_prima: number; costo_merma: number }

const fmt = (n: number, dec = 0) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n)
const num = (s: string) => { const n = parseFloat(String(s).replace(',', '.')); return isNaN(n) ? 0 : n }

function cantidadLegible(q: number, u: Unidad) {
    if (u === 'g' && q >= 1000) return `${(q / 1000).toLocaleString('es-AR', { maximumFractionDigits: 2 })} kg`
    if (u === 'ml' && q >= 1000) return `${(q / 1000).toLocaleString('es-AR', { maximumFractionDigits: 2 })} l`
    const dec = u === 'u' ? 1 : 0
    return `${q.toLocaleString('es-AR', { maximumFractionDigits: dec })} ${u}`
}

export default function CalculadoraTab() {
    const { tema } = useTema()
    const [recetas, setRecetas] = useState<Receta[]>([])
    const [ingredientes, setIngredientes] = useState<Ingrediente[]>([])
    const [costos, setCostos] = useState<Record<string, Costo>>({})
    const [loading, setLoading] = useState(true)

    const [recetaId, setRecetaId] = useState('')
    const [items, setItems] = useState<Item[]>([])
    const [objetivo, setObjetivo] = useState('')
    const [manoObra, setManoObra] = useState('0')
    const [packaging, setPackaging] = useState('0')
    const [ganancia, setGanancia] = useState('50')

    const c = {
        card: tema === 'oscuro' ? '#162210' : '#F7F3EC',
        card2: tema === 'oscuro' ? '#1E2E14' : '#EDE8DF',
        border: tema === 'oscuro' ? '#2A4A1A' : '#C8BFA8',
        text: tema === 'oscuro' ? '#E8E4D8' : '#1A1A14',
        muted: tema === 'oscuro' ? '#8BAA6E' : '#6B6550',
        muted2: tema === 'oscuro' ? '#4A6A3A' : '#9B9280',
        input: tema === 'oscuro' ? '#1E2E14' : '#F7F3EC',
    }

    useEffect(() => {
        Promise.all([
            supabase.from('recetas').select('*').order('nombre'),
            supabase.from('ingredientes').select('id, nombre, unidad_base, costo_unitario'),
            supabase.from('costo_recetas').select('id, costo_materia_prima, costo_merma'),
        ]).then(([rec, ing, cos]) => {
            setRecetas(rec.data || [])
            setIngredientes(ing.data || [])
            setCostos(Object.fromEntries((cos.data || []).map((x: Costo) => [x.id, x])))
            setLoading(false)
        })
    }, [])

    const receta = recetas.find(r => r.id === recetaId)

    const elegirReceta = async (id: string) => {
        setRecetaId(id)
        const r = recetas.find(x => x.id === id)
        if (!r) { setItems([]); return }
        setObjetivo(String(r.es_preparacion ? r.rendimiento_cantidad : r.porciones))
        setManoObra(String(r.mano_obra))
        setPackaging(String(r.packaging))
        setGanancia(String(r.ganancia_pct))
        const { data } = await supabase.from('receta_items').select('ingrediente_id, preparacion_id, cantidad').eq('receta_id', id)
        setItems(data || [])
    }

    // Base de la receta: porciones, o rendimiento si es preparación
    const base = receta ? Number(receta.es_preparacion ? receta.rendimiento_cantidad : receta.porciones) || 1 : 1
    const factor = num(objetivo) > 0 ? num(objetivo) / base : 0
    const unidadBase = receta?.es_preparacion ? (receta.rendimiento_unidad ?? 'g') : null

    const costoUnitPrep = (id: string) => {
        const r = recetas.find(x => x.id === id)
        const k = costos[id]
        if (!r || !k || !r.rendimiento_cantidad) return 0
        return (Number(k.costo_materia_prima) + Number(k.costo_merma)) / Number(r.rendimiento_cantidad)
    }

    const filas = items.map(it => {
        const cantidad = Number(it.cantidad) * factor
        if (it.ingrediente_id) {
            const i = ingredientes.find(x => x.id === it.ingrediente_id)
            return { nombre: i?.nombre ?? '(ingrediente eliminado)', unidad: i?.unidad_base ?? 'g', cantidad, costo: cantidad * Number(i?.costo_unitario ?? 0), prep: false }
        }
        const p = recetas.find(x => x.id === it.preparacion_id)
        return { nombre: p?.nombre ?? '(preparación eliminada)', unidad: (p?.rendimiento_unidad ?? 'g') as Unidad, cantidad, costo: cantidad * costoUnitPrep(it.preparacion_id!), prep: true }
    })

    const materiaPrima = filas.reduce((s, f) => s + f.costo, 0)
    const merma = materiaPrima * Number(receta?.merma_pct ?? 0) / 100
    const costoTotal = materiaPrima + merma + num(manoObra) + num(packaging)
    const precioSugerido = costoTotal * (1 + num(ganancia) / 100)
    const unidades = num(objetivo)

    const inputStyle = {
        width: '100%', background: c.input, border: `1px solid ${c.border}`,
        borderRadius: '10px', padding: '0.65rem 0.9rem', color: c.text,
        fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' as const,
    }
    const labelStyle = {
        fontSize: '0.72rem', color: c.muted, display: 'block', marginBottom: '0.375rem',
        textTransform: 'uppercase' as const, letterSpacing: '0.06em',
    }

    if (loading) return <div style={{ color: c.muted2, fontSize: '0.9rem', textAlign: 'center', padding: '3rem 0' }}>Cargando...</div>

    if (recetas.length === 0) return (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: c.muted, fontSize: '0.85rem' }}>
            Primero cargá una receta en la pestaña Recetas y preparaciones.
        </div>
    )

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ color: c.muted, fontSize: '0.82rem' }}>
                Elegí una receta y cuánto querés hacer: se escalan las cantidades, el costo y el precio. No modifica la receta original.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                <div>
                    <label style={labelStyle}>Receta</label>
                    <select style={inputStyle} value={recetaId} onChange={e => elegirReceta(e.target.value)}>
                        <option value="">Elegir...</option>
                        {recetas.map(r => <option key={r.id} value={r.id}>{r.nombre}{r.es_preparacion ? ' (preparación)' : ''}</option>)}
                    </select>
                </div>
                {receta && (
                    <div>
                        <label style={labelStyle}>
                            {receta.es_preparacion ? `Cantidad a preparar (${unidadBase})` : 'Porciones / unidades'}
                        </label>
                        <input style={inputStyle} inputMode="decimal" value={objetivo} onChange={e => setObjetivo(e.target.value)} />
                        <p style={{ color: c.muted2, fontSize: '0.72rem', marginTop: '0.3rem' }}>
                            La receta original rinde {base} {receta.es_preparacion ? unidadBase : (base === 1 ? 'porción' : 'porciones')}
                            {factor > 0 && factor !== 1 && ` · ×${factor.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`}
                        </p>
                    </div>
                )}
            </div>

            {receta && (
                <>
                    {/* Ingredientes escalados */}
                    <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '16px', overflow: 'hidden' }}>
                        {filas.length === 0 ? (
                            <p style={{ color: c.muted2, fontSize: '0.85rem', padding: '1.25rem', textAlign: 'center' }}>Esta receta no tiene ingredientes cargados.</p>
                        ) : filas.map((f, idx) => (
                            <div key={idx} style={{
                                display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '1rem', alignItems: 'center',
                                padding: '0.75rem 1rem', borderBottom: idx < filas.length - 1 ? `1px solid ${c.border}` : 'none', fontSize: '0.85rem',
                            }}>
                                <span style={{ color: c.text }}>
                                    {f.nombre}
                                    {f.prep && <span style={{ color: '#60A5FA', fontSize: '0.7rem', marginLeft: '0.4rem' }}>preparación</span>}
                                </span>
                                <span style={{ color: c.muted, textAlign: 'right' }}>{cantidadLegible(f.cantidad, f.unidad)}</span>
                                <span style={{ color: c.muted, textAlign: 'right', minWidth: '80px' }}>{fmt(f.costo)}</span>
                            </div>
                        ))}
                    </div>

                    {/* Ajustes del pedido */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                        <div>
                            <label style={labelStyle}>Mano de obra $</label>
                            <input style={inputStyle} inputMode="decimal" value={manoObra} onChange={e => setManoObra(e.target.value)} />
                        </div>
                        <div>
                            <label style={labelStyle}>Packaging $</label>
                            <input style={inputStyle} inputMode="decimal" value={packaging} onChange={e => setPackaging(e.target.value)} />
                        </div>
                        <div>
                            <label style={labelStyle}>Ganancia %</label>
                            <input style={inputStyle} inputMode="decimal" value={ganancia} onChange={e => setGanancia(e.target.value)} />
                        </div>
                    </div>
                    <p style={{ color: c.muted2, fontSize: '0.72rem', marginTop: '-0.5rem' }}>
                        Mano de obra y packaging vienen de la receta sin escalar: ajustalos según el pedido.
                    </p>

                    {/* Resumen */}
                    <div style={{ background: c.card2, borderRadius: '12px', padding: '1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem' }}>
                        {[
                            ['Materia prima', fmt(materiaPrima)],
                            [`Merma (${Number(receta.merma_pct)}%)`, fmt(merma)],
                            ['Costo total', fmt(costoTotal)],
                        ].map(([k, v]) => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: c.muted }}>{k}</span>
                                <span style={{ color: c.text, fontWeight: k === 'Costo total' ? 600 : 400 }}>{v}</span>
                            </div>
                        ))}
                        <div style={{ borderTop: `1px solid ${c.border}`, margin: '0.25rem 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{ color: c.muted }}>Precio sugerido</span>
                            <span style={{ color: '#C9A96E', fontWeight: 700, fontSize: '1.15rem' }}>{fmt(precioSugerido)}</span>
                        </div>
                        {!receta.es_preparacion && unidades > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: c.muted }}>Por porción</span>
                                <span style={{ color: c.text }}>{fmt(precioSugerido / unidades)}</span>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}