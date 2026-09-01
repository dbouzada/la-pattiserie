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
    { key: 'efectivo', label: 'Efectivo', color: '#C9A96E' },
    { key: 'tarjeta', label: 'Tarjeta', color: '#60A5FA' },
    { key: 'transferencia', label: 'Transferencia', color: '#A78BFA' },
    { key: 'mercadopago', label: 'Mercado Pago', color: '#34D399' },
    { key: 'pedidosya', label: 'Pedidos Ya', color: '#F87171' },
]

const MEDIOS_CON_DNI = ['tarjeta', 'transferencia', 'mercadopago']

export default function NuevaVenta() {
    const { tema } = useTema()
    const [productos, setProductos] = useState<Producto[]>([])
    const [busqueda, setBusqueda] = useState('')
    const [carrito, setCarrito] = useState<ItemCarrito[]>([])
    const [medio, setMedio] = useState('efectivo')
    const [descuentoTipo, setDescuentoTipo] = useState<'monto' | 'porcentaje'>('monto')
    const [descuentoValor, setDescuentoValor] = useState<number>(0)
    const [dni, setDni] = useState('')
    const [guardando, setGuardando] = useState(false)
    const [exito, setExito] = useState(false)

    const c = {
        card: tema === 'oscuro' ? '#162210' : '#F7F3EC',
        card2: tema === 'oscuro' ? '#1E2E14' : '#EDE8DF',
        border: tema === 'oscuro' ? '#2A4A1A' : '#C8BFA8',
        text: tema === 'oscuro' ? '#E8E4D8' : '#1A1A14',
        muted: tema === 'oscuro' ? '#8BAA6E' : '#6B6550',
        muted2: tema === 'oscuro' ? '#4A6A3A' : '#9B9280',
        input: tema === 'oscuro' ? '#162210' : '#FFFFFF',
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

    const actualizarGramos = (id: number, gramos: number) => {
        setCarrito(carrito.map(i => {
            if (i.producto.id !== id) return i
            const precioKg = i.producto.precio_kg || i.producto.precio_venta
            const subtotal = Math.round((gramos / 1000) * precioKg)
            return { ...i, gramos, subtotal }
        }))
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
                medio_pago: medio,
                total,
                descuento: montoDescuento,
                descuento_tipo: descuentoTipo,
                total_antes_descuento: subtotalBruto,
                dni_cliente: MEDIOS_CON_DNI.includes(medio) ? dni || null : null,
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
                p_cantidad: item.producto.venta_por === 'gramos' ? 1 : item.cantidad,
            })
        }

        setCarrito([])
        setMedio('efectivo')
        setDescuentoValor(0)
        setDni('')
        setGuardando(false)
        setExito(true)
        setTimeout(() => setExito(false), 3000)
    }

    const medioActual = MEDIOS.find(m => m.key === medio)!

    return (
        <>
            <style>{`
        .medios-grid { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .medio-btn { flex: 1; min-width: 80px; }
        @media (max-width: 480px) {
          .medio-btn { min-width: calc(50% - 0.25rem); }
        }
      `}</style>

            <div style={{ maxWidth: '560px', margin: '0 auto', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {/* Header */}
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
                            padding: '1rem', color: c.text,
                            fontSize: '1rem', outline: 'none', boxSizing: 'border-box' as const,
                        }}
                        onFocus={e => e.target.style.borderColor = '#C9A96E50'}
                        onBlur={e => e.target.style.borderColor = c.border}
                    />
                    {busqueda && filtrados.length > 0 && (
                        <div style={{
                            position: 'absolute', zIndex: 10, width: '100%',
                            marginTop: '0.5rem', background: c.card,
                            border: `1px solid ${c.border}`, borderRadius: '12px',
                            overflow: 'hidden', boxShadow: '0 20px 40px #00000030',
                        }}>
                            {filtrados.slice(0, 8).map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => agregarProducto(p)}
                                    style={{
                                        width: '100%', textAlign: 'left',
                                        padding: '0.875rem 1rem', display: 'flex',
                                        justifyContent: 'space-between', alignItems: 'center',
                                        background: 'transparent', border: 'none',
                                        borderBottom: `1px solid ${c.border}`, cursor: 'pointer', color: c.text,
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = c.card2)}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <div>
                                        <span style={{ fontSize: '0.9rem' }}>{p.nombre}</span>
                                        {p.venta_por === 'gramos' && (
                                            <span style={{ fontSize: '0.75rem', color: '#60A5FA', marginLeft: '0.5rem' }}>por gramos</span>
                                        )}
                                    </div>
                                    <span style={{ fontSize: '0.9rem', color: '#C9A96E', fontWeight: 600, flexShrink: 0, marginLeft: '0.5rem' }}>
                                        {p.venta_por === 'gramos' && p.precio_kg
                                            ? `${fmt(p.precio_kg)}/kg`
                                            : fmt(p.precio_venta)
                                        }
                                    </span>
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
                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                padding: '0.875rem 1rem',
                                borderBottom: idx < carrito.length - 1 ? `1px solid ${c.border}` : 'none',
                            }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: '0.875rem', color: c.text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {item.producto.nombre}
                                    </p>
                                    <p style={{ fontSize: '0.8rem', color: '#C9A96E', marginTop: '0.1rem' }}>
                                        {fmt(item.subtotal)}
                                    </p>
                                </div>

                                {item.producto.venta_por === 'gramos' ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
                                        <input
                                            type="number"
                                            value={item.gramos || ''}
                                            onChange={e => actualizarGramos(item.producto.id, Number(e.target.value))}
                                            placeholder="0"
                                            style={{
                                                width: '72px', background: c.card2,
                                                border: `1px solid ${c.border}`, borderRadius: '8px',
                                                padding: '0.375rem 0.5rem', color: c.text,
                                                fontSize: '0.875rem', outline: 'none', textAlign: 'right',
                                            }}
                                        />
                                        <span style={{ fontSize: '0.75rem', color: c.muted }}>g</span>
                                        <button
                                            onClick={() => setCarrito(carrito.filter(i => i.producto.id !== item.producto.id))}
                                            style={{
                                                width: '28px', height: '28px', borderRadius: '8px',
                                                background: '#F8717115', border: '1px solid #F8717130',
                                                color: '#F87171', fontSize: '0.9rem', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}
                                        >✕</button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
                                        <button
                                            onClick={() => actualizarCantidad(item.producto.id, item.cantidad - 1)}
                                            style={{
                                                width: '32px', height: '32px', borderRadius: '8px',
                                                background: c.card2, border: `1px solid ${c.border}`,
                                                color: c.text, fontSize: '1.1rem', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}
                                        >−</button>
                                        <span style={{ color: c.text, fontSize: '0.9rem', width: '24px', textAlign: 'center', fontWeight: 600 }}>
                                            {item.cantidad}
                                        </span>
                                        <button
                                            onClick={() => actualizarCantidad(item.producto.id, item.cantidad + 1)}
                                            style={{
                                                width: '32px', height: '32px', borderRadius: '8px',
                                                background: c.card2, border: `1px solid ${c.border}`,
                                                color: c.text, fontSize: '1.1rem', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}
                                        >+</button>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Descuento */}
                        <div style={{
                            padding: '0.875rem 1rem', borderTop: `1px solid ${c.border}`,
                            background: c.card2, display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
                        }}>
                            <span style={{ fontSize: '0.8rem', color: c.muted, whiteSpace: 'nowrap' }}>Descuento</span>
                            <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${c.border}` }}>
                                {(['monto', 'porcentaje'] as const).map(t => (
                                    <button
                                        key={t}
                                        onClick={() => { setDescuentoTipo(t); setDescuentoValor(0) }}
                                        style={{
                                            padding: '0.375rem 0.875rem', fontSize: '0.8rem',
                                            background: descuentoTipo === t ? '#C9A96E' : 'transparent',
                                            color: descuentoTipo === t ? '#0F1A09' : c.muted,
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
                                placeholder="0"
                                min={0}
                                style={{
                                    flex: 1, minWidth: '60px', background: 'transparent',
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
                            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#4ADE80', letterSpacing: '-0.03em' }}>
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
                    <div className="medios-grid">
                        {MEDIOS.map(m => (
                            <button
                                key={m.key}
                                onClick={() => setMedio(m.key)}
                                className="medio-btn"
                                style={{
                                    padding: '0.625rem 0.5rem', borderRadius: '10px',
                                    fontSize: '0.8rem', fontWeight: medio === m.key ? 600 : 400,
                                    cursor: 'pointer', textAlign: 'center',
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

                {/* DNI — solo para tarjeta, transferencia y MP */}
                {MEDIOS_CON_DNI.includes(medio) && (
                    <div>
                        <label style={{
                            fontSize: '0.72rem', color: c.muted, display: 'block',
                            marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em',
                        }}>
                            DNI / CUIT del cliente <span style={{ color: c.muted2, fontWeight: 400 }}>(para facturación)</span>
                        </label>
                        <input
                            type="text"
                            value={dni}
                            onChange={e => setDni(e.target.value)}
                            placeholder="Ej: 30123456 o 20-30123456-7"
                            style={{
                                width: '100%', background: c.input,
                                border: `1px solid ${c.border}`, borderRadius: '12px',
                                padding: '0.875rem 1rem', color: c.text,
                                fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' as const,
                            }}
                            onFocus={e => e.target.style.borderColor = '#C9A96E50'}
                            onBlur={e => e.target.style.borderColor = c.border}
                        />
                    </div>
                )}

                {/* Botón confirmar */}
                <button
                    onClick={confirmar}
                    disabled={carrito.length === 0 || guardando}
                    style={{
                        width: '100%', padding: '1.125rem',
                        background: carrito.length === 0 || guardando ? c.card2 : '#C9A96E',
                        color: carrito.length === 0 || guardando ? c.muted2 : '#0F1A09',
                        border: 'none', borderRadius: '14px',
                        fontSize: '1.1rem', fontWeight: 700,
                        cursor: carrito.length === 0 || guardando ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s', letterSpacing: '-0.01em',
                    }}
                >
                    {guardando ? 'Guardando...' : carrito.length === 0
                        ? 'Agregá productos'
                        : `Confirmar · ${fmt(total)} · ${medioActual.label}`}
                </button>
            </div>
        </>
    )
}