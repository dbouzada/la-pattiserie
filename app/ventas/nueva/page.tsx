'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

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



const MEDIOS = ['efectivo', 'tarjeta', 'transferencia', 'mercadopago', 'pedidosya']

export default function NuevaVenta() {
    const [productos, setProductos] = useState<Producto[]>([])
    const [busqueda, setBusqueda] = useState('')
    const [carrito, setCarrito] = useState<ItemCarrito[]>([])
    const [medio, setMedio] = useState('efectivo')
    const [guardando, setGuardando] = useState(false)
    const [exito, setExito] = useState(false)

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
            setCarrito([...carrito, {
                producto: p,
                cantidad: 1,
                gramos: null,
                subtotal: p.precio_venta
            }])
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
        setCarrito(carrito.map(i =>
            i.producto.id === id
                ? { ...i, gramos, subtotal: Math.round((gramos / 1000) * (i.producto.precio_kg || i.producto.precio_venta)) }
                : i
        ))
    }

    const total = carrito.reduce((acc, i) => acc + i.subtotal, 0)

    const fmt = (n: number) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

    const confirmar = async () => {
        if (carrito.length === 0) return
        setGuardando(true)

        const { data: venta, error } = await supabase
            .from('ventas')
            .insert({ medio_pago: medio, total })
            .select()
            .single()

        if (error || !venta) { setGuardando(false); return }

        await supabase.from('venta_items').insert(
            carrito.map(i => ({
                venta_id: venta.id,
                producto_id: i.producto.id,
                cantidad: i.producto.venta_por === 'unidad' ? i.cantidad : null,
                gramos: i.producto.venta_por === 'gramos' ? i.gramos : null,
                precio_unit: i.producto.precio_venta,
                subtotal: i.subtotal
            }))
        )

        // Actualizar stock
        for (const item of carrito) {
            await supabase.rpc('decrementar_stock', {
                p_id: item.producto.id,
                p_cantidad: item.cantidad
            })
        }

        setCarrito([])
        setMedio('efectivo')
        setGuardando(false)
        setExito(true)
        setTimeout(() => setExito(false), 3000)
    }

    return (
        <div className="max-w-2xl mx-auto space-y-4">
            <h1 className="text-2xl font-semibold text-amber-400">Nueva venta</h1>

            {exito && (
                <div className="bg-green-900 border border-green-700 text-green-300 px-4 py-3 rounded-lg">
                    ✓ Venta registrada correctamente
                </div>
            )}

            {/* Buscador */}
            <div className="relative">
                <input
                    type="text"
                    placeholder="Buscar producto..."
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                />
                {busqueda && filtrados.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg overflow-hidden shadow-xl">
                        {filtrados.slice(0, 6).map(p => (
                            <button
                                key={p.id}
                                onClick={() => agregarProducto(p)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-800 flex justify-between items-center"
                            >
                                <span className="text-white text-sm">{p.nombre}</span>
                                <span className="text-amber-400 text-sm">{fmt(p.precio_venta)}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Carrito */}
            {carrito.length > 0 && (
                <div className="bg-gray-900 rounded-xl border border-gray-800">
                    {carrito.map(item => (
                        <div key={item.producto.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 last:border-0">
                            <div className="flex-1">
                                <p className="text-sm text-white">{item.producto.nombre}</p>
                                <p className="text-xs text-amber-400">{fmt(item.subtotal)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => actualizarCantidad(item.producto.id, item.cantidad - 1)}
                                    className="w-7 h-7 rounded bg-gray-800 text-white hover:bg-gray-700">−</button>
                                <span className="text-white w-6 text-center text-sm">{item.cantidad}</span>
                                <button onClick={() => actualizarCantidad(item.producto.id, item.cantidad + 1)}
                                    className="w-7 h-7 rounded bg-gray-800 text-white hover:bg-gray-700">+</button>
                            </div>
                        </div>
                    ))}
                    <div className="px-4 py-3 flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Total</span>
                        <span className="text-green-400 text-xl font-semibold">{fmt(total)}</span>
                    </div>
                </div>
            )}

            {/* Medio de pago */}
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {MEDIOS.map(m => (
                    <button
                        key={m}
                        onClick={() => setMedio(m)}
                        className={`py-2 rounded-lg text-xs font-medium capitalize border transition-colors ${medio === m
                            ? 'bg-amber-500 border-amber-500 text-black'
                            : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                            }`}
                    >
                        {m}
                    </button>
                ))}
            </div>

            {/* Confirmar */}
            <button
                onClick={confirmar}
                disabled={carrito.length === 0 || guardando}
                className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-800 disabled:text-gray-600 text-black font-semibold rounded-xl transition-colors"
            >
                {guardando ? 'Guardando...' : `Confirmar venta · ${fmt(total)}`}
            </button>
        </div>
    )
}