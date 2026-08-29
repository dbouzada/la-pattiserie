'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTema } from '@/lib/theme'

interface Producto {
    id: number
    nombre: string
    precio_venta: number
    precio_kg?: number
    venta_por: string
    stock: number
}

interface ItemCarrito {
    producto: Producto
    cantidad: number
    gramos: number | null
    subtotal: number
}

const MEDIOS = [
    { key: 'efectivo', label: 'Efectivo', color: '#FBBF24' },
    { key: 'tarjeta', label: 'Tarjeta', color: '#60A5FA' },
    { key: 'transferencia', label: 'Transferencia', color: '#A78BFA' },
    { key: 'mercadopago', label: 'Mercado Pago', color: '#34D399' },
    { key: 'pedidosya', label: 'Pedidos Ya', color: '#F87171' },
]

export default function NuevaVenta() {
    const { tema } = useTema()
    const [productos, setProductos] = useState<Producto[]>([])
    const [busqueda, setBusqueda] = useState('')
    const [carrito, setCarrito] = useState<ItemCarrito[]>([])
    const [medio, setMedio] = useState('efectivo')
    const [descuentoTipo, setDescuentoTipo] = useState<'monto' | 'porcentaje'>('monto')
    const [descuentoValor, setDescuentoValor] = useState<number>(0)
    const [guardando, setGuardando] = useState(false)
    const [exito, setExito] = useState(false)

    const c = {
        card: tema === 'oscuro' ? '#0F0F18' : '#FFFFFF',
        card2: tema === 'oscuro' ? '#16161F' : '#F0EFE9',
        border: tema === 'oscuro' ? '#1E1E2E' : '#E5E4E0',
        text: tema === 'oscuro' ? '#F0EDE6' : '#1A1A1F',
        muted: tema === 'oscuro' ? '#3A3A4A' : '#9B9B9B',
        muted2: tema === 'oscuro' ? '#2A2A35' : '#C5C4C0',
        input: tema === 'oscuro' ? '#0F0F18' : '#FFFFFF',
    }

    useEffect(() => {
        supabase.from('productos').select('*').eq('activo', true).order('nombre')
            .then(({ data }) => setProductos(data || []))
    }, [])

    const filtrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    )

    const agregarProducto = (p: Producto) => {
        const existe = carrito.find(i => i.producto.id === p.id)
        if (existe) {
            setCarrito(carrito.map(i =>
                i.producto.id === p.id
                    ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * p.precio_venta }
                    : i
            ))
        } else {
            setCarrito([...carrito, { producto: p, cantidad: 1, gramos: null, subtotal: p.precio_venta }])
        }
        setBusqueda('')
    }

    const actualizarCantidad = (id: number, cantidad: number) => {
        if (cantidad <= 0) {
            setCarrito(carrito.filter(i => i.producto.id !== id))
            return
        }
        setCarrito(carrito.map(i =>
            i.producto.id === id
                ? { ...i, cantidad, subtotal: cantidad * i.producto.precio_venta }
                : i
        ))
    }

    const subtotalBruto = carrito.reduce((acc, i) => acc + i.subtotal, 0)
    const montoDescuento = descuentoTipo === 'porcentaje'
        ? Math.round(subtotalBruto * (descuentoValor / 100))
        : descuentoValor
    const total = Math.max(0, subtotalBruto - montoDescuento)

    const fmt = (n: number) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

    const confirmar = async () => {
        if (carrito.length === 0) return
        setGuardando(true)

        const { data: venta, error } = await supabase
            .from('ventas')
            .insert({
                medio_pago: medio, total,
                descuento: montoDescuento,
                descuento_tipo: descuentoTipo,
                total_antes_descuento: subtotalBruto,
            })
            .select().single()

        if (error || !venta) { setGuardando(false); return }

        await supabase.from('venta_items').insert(
            carrito.map(i => ({
                venta_id: venta.id,
                producto_id: i.producto.id,
                cantidad: i.producto.venta_por === 'unidad' ? i.cantidad : null,
                gramos: i.producto.venta_por === 'gramos' ? i.gramos : null,
                precio_unit: i.producto.precio_venta,
                subtotal: i.subtotal,
            }))
        )

        for (const item of carrito) {
            await supabase.rpc('decrementar_stock', {
                p_id: item.producto.id,
                p_cantidad: item.cantidad,
            })
        }

        setCarrito([])
        setMedio('efectivo')
        setDescuentoValor(0)
        setGuardando(false)
        setExito(true)
        setTimeout(() => setExito(false), 3000)
    }

    const medioActual = MEDIOS.find(m => m.key === medio)!

    return (
        <div style={{ maxWidth: '560px', margin: '0 auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: c.text, letterSpacing: '-0.03em' }}>Nueva venta</h1>
                <p style={{ fontSize: '0.8rem', color: c.muted, marginTop: '0.2rem' }}>
                    {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
            </div>

            {exito && (
                <div style={{
                    background: '#4ADE8015', border: '1px solid #4ADE8030',
                    color: '#4ADE80', padding: '0.875rem 1rem',
                    borderRadius: '12px', fontSize: '0.85rem', fontWeight: 500,
                }}>
                    ✓ Venta registrada correctamente
                </div>
            )}

            {/* Buscador */}
            <div style={{ position: 'relative' }}>
                <input
                    type="text"
                    placeholder="Buscar producto..."
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    autoFocus
                    style={{
                        width: '100%', background: c.input,
                        border: `1px solid ${c.border}`, borderRadius: '12px',
                        padding: '0.875rem 1rem', color: c.text,
                        fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                    }}
                    onFocus={e => e.target.style.borderColor = '#F59E0B50'}
                    onBlur={e => e.target.style.borderColor = c.border}
                />
                {busqueda && filtrados.length > 0 && (
                    <div style={{
                        position: 'absolute', zIndex: 10, width: '100%',
                        marginTop: '0.5rem', background: c.card,
                        border: `1px solid ${c.border}`, borderRadius: '12px',
                        overflow: 'hidden', boxShadow: '0 20px 40px #00000030',
                    }}>
                        {filtrados.slice(0, 6).map(p => (
                            <button
                                key={p.id}
                                onClick={() => agregarProducto(p)}
                                style={{
                                    width: '100%', textAlign: 'left',
                                    padding: '0.75rem 1rem', display: 'flex',
                                    justifyContent: 'space-between', alignItems: 'center',
                                    background: 'transparent', border: 'none',
                                    borderBottom: `1px solid ${c.border}`, cursor: 'pointer', color: c.text,
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = c.card2)}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                <span style={{ fontSize: '0.875rem' }}>{p.nombre}</span>
                                <span style={{ fontSize: '0.875rem', color: '#F59E0B', fontWeight: 500 }}>{fmt(p.precio_venta)}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Carrito */}
            {carrito.length > 0 && (
                <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '16px', overflow: 'hidden' }}>
                    {carrito.map((item, idx) => (
                        <div key={item.producto.id} style={{
                            display: 'flex', alignItems: 'center', gap: '1rem',
                            padding: '0.875rem 1rem',
                            borderBottom: idx < carrito.length - 1 ? `1px solid ${c.border}` : 'none',
                        }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: '0.875rem', color: c.text, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {item.producto.nombre}
                                </p>
                                <p style={{ fontSize: '0.8rem', color: '#F59E0B', marginTop: '0.1rem' }}>
                                    {fmt(item.subtotal)}
                                </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <button
                                    onClick={() => actualizarCantidad(item.producto.id, item.cantidad - 1)}
                                    style={{
                                        width: '28px', height: '28px', borderRadius: '8px',
                                        background: c.card2, border: `1px solid ${c.border}`,
                                        color: c.text, fontSize: '1rem', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}
                                >−</button>
                                <span style={{ color: c.text, fontSize: '0.9rem', width: '24px', textAlign: 'center', fontWeight: 600 }}>
                                    {item.cantidad}
                                </span>
                                <button
                                    onClick={() => actualizarCantidad(item.producto.id, item.cantidad + 1)}
                                    style={{
                                        width: '28px', height: '28px', borderRadius: '8px',
                                        background: c.card2, border: `1px solid ${c.border}`,
                                        color: c.text, fontSize: '1rem', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}
                                >+</button>
                            </div>
                        </div>
                    ))}

                    {/* Descuento */}
                    <div style={{
                        padding: '0.875rem 1rem', borderTop: `1px solid ${c.border}`,
                        background: c.card2, display: 'flex', alignItems: 'center', gap: '0.75rem',
                    }}>
                        <span style={{ fontSize: '0.8rem', color: c.muted, whiteSpace: 'nowrap' }}>Descuento</span>
                        <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${c.border}` }}>
                            {(['monto', 'porcentaje'] as const).map(t => (
                                <button
                                    key={t}
                                    onClick={() => { setDescuentoTipo(t); setDescuentoValor(0) }}
                                    style={{
                                        padding: '0.3rem 0.75rem', fontSize: '0.75rem',
                                        background: descuentoTipo === t ? '#F59E0B' : 'transparent',
                                        color: descuentoTipo === t ? '#0A0A0F' : c.muted,
                                        border: 'none', cursor: 'pointer',
                                        fontWeight: descuentoTipo === t ? 600 : 400,
                                    }}
                                >
                                    {t === 'monto' ? '$' : '%'}
                                </button>
                            ))}
                        </div>
                        <input
                            type="number"
                            value={descuentoValor || ''}
                            onChange={e => setDescuentoValor(Number(e.target.value))}
                            placeholder={descuentoTipo === 'porcentaje' ? '0%' : '$ 0'}
                            min={0}
                            max={descuentoTipo === 'porcentaje' ? 100 : subtotalBruto}
                            style={{
                                flex: 1, background: 'transparent',
                                border: `1px solid ${c.border}`, borderRadius: '8px',
                                padding: '0.375rem 0.75rem',
                                color: montoDescuento > 0 ? '#F87171' : c.text,
                                fontSize: '0.875rem', outline: 'none', textAlign: 'right',
                            }}
                        />
                        {montoDescuento > 0 && (
                            <span style={{ fontSize: '0.8rem', color: '#F87171', whiteSpace: 'nowrap' }}>
                                −{fmt(montoDescuento)}
                            </span>
                        )}
                    </div>

                    {/* Total */}
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '1rem', background: c.card2, borderTop: `1px solid ${c.border}`,
                    }}>
                        <div>
                            <span style={{ fontSize: '0.8rem', color: c.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</span>
                            {montoDescuento > 0 && (
                                <p style={{ fontSize: '0.75rem', color: c.muted2, textDecoration: 'line-through', marginTop: '0.1rem' }}>
                                    {fmt(subtotalBruto)}
                                </p>
                            )}
                        </div>
                        <span style={{ fontSize: '1.75rem', fontWeight: 700, color: '#4ADE80', letterSpacing: '-0.03em' }}>
                            {fmt(total)}
                        </span>
                    </div>
                </div>
            )}

            {/* Medio de pago */}
            <div>
                <p style={{ fontSize: '0.72rem', color: c.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
                    Medio de pago
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {MEDIOS.map(m => (
                        <button
                            key={m.key}
                            onClick={() => setMedio(m.key)}
                            style={{
                                padding: '0.5rem 1rem', borderRadius: '10px',
                                fontSize: '0.8rem', fontWeight: medio === m.key ? 600 : 400,
                                cursor: 'pointer',
                                border: `1px solid ${medio === m.key ? m.color + '60' : c.border}`,
                                background: medio === m.key ? m.color + '20' : c.card,
                                color: medio === m.key ? m.color : c.muted,
                                transition: 'all 0.15s',
                            }}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Botón confirmar */}
            <button
                onClick={confirmar}
                disabled={carrito.length === 0 || guardando}
                style={{
                    width: '100%', padding: '1rem',
                    background: carrito.length === 0 || guardando ? c.card2 : '#F59E0B',
                    color: carrito.length === 0 || guardando ? c.muted2 : '#0A0A0F',
                    border: 'none', borderRadius: '14px',
                    fontSize: '1rem', fontWeight: 700,
                    cursor: carrito.length === 0 || guardando ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s', letterSpacing: '-0.01em',
                }}
            >
                {guardando ? 'Guardando...' : carrito.length === 0
                    ? 'Agregá productos'
                    : `Confirmar · ${fmt(total)} · ${medioActual.label}`}
            </button>
        </div>
    )
}