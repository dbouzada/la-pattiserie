'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Producto {
    id: number
    nombre: string
    stock: number
    costo: number
    packaging: number
    costo_total: number
    precio_kg: number | null
    precio_venta: number
    venta_por: string
    activo: boolean
}

export default function Productos() {
    const [productos, setProductos] = useState<Producto[]>([])
    const [loading, setLoading] = useState(true)
    const [editando, setEditando] = useState<Producto | null>(null)
    const [guardando, setGuardando] = useState(false)
    const [busqueda, setBusqueda] = useState('')

    const cargar = async () => {
        const { data } = await supabase
            .from('productos')
            .select('*')
            .order('nombre')
        setProductos(data || [])
        setLoading(false)
    }

    useEffect(() => { cargar() }, [])

    const guardar = async () => {
        if (!editando) return
        setGuardando(true)
        await supabase.from('productos').update({
            precio_venta: editando.precio_venta,
            precio_kg: editando.precio_kg,
            costo: editando.costo,
            packaging: editando.packaging,
            activo: editando.activo,
        }).eq('id', editando.id)
        await cargar()
        setEditando(null)
        setGuardando(false)
    }

    const fmt = (n: number) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

    const filtrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    )

    const margen = (p: Producto) => {
        const m = ((p.precio_venta - p.costo_total) / p.precio_venta) * 100
        return m.toFixed(0)
    }

    if (loading) return <p className="text-gray-400">Cargando...</p>

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-amber-400">Productos</h1>
                <span className="text-gray-500 text-sm">{productos.length} productos</span>
            </div>

            <input
                type="text"
                placeholder="Buscar..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
            />

            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-gray-500 text-xs border-b border-gray-800">
                            <th className="text-left px-4 py-3">Producto</th>
                            <th className="text-right px-4 py-3">Costo</th>
                            <th className="text-right px-4 py-3">Precio</th>
                            <th className="text-right px-4 py-3">Margen</th>
                            <th className="text-right px-4 py-3">Stock</th>
                            <th className="text-center px-4 py-3">Estado</th>
                            <th className="px-4 py-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtrados.map(p => (
                            <tr key={p.id} className={`border-b border-gray-800 last:border-0 ${!p.activo ? 'opacity-40' : ''}`}>
                                <td className="px-4 py-3 text-white">{p.nombre}</td>
                                <td className="px-4 py-3 text-right text-gray-400">{fmt(p.costo_total)}</td>
                                <td className="px-4 py-3 text-right text-amber-400">{fmt(p.precio_venta)}</td>
                                <td className="px-4 py-3 text-right">
                                    <span className={`${Number(margen(p)) > 40 ? 'text-green-400' : 'text-orange-400'}`}>
                                        {margen(p)}%
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <span className={`${p.stock < 0 ? 'text-red-400' : p.stock < 10 ? 'text-orange-400' : 'text-gray-300'}`}>
                                        {p.stock}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`text-xs px-2 py-1 rounded-full ${p.activo ? 'bg-green-900 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                                        {p.activo ? 'activo' : 'inactivo'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        onClick={() => setEditando(p)}
                                        className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-800"
                                    >
                                        editar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal edición */}
            {editando && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-md space-y-4">
                        <h2 className="text-lg font-medium text-white">{editando.nombre}</h2>

                        {[
                            { label: 'Precio de venta', key: 'precio_venta' },
                            { label: 'Costo', key: 'costo' },
                            { label: 'Packaging', key: 'packaging' },
                            { label: 'Precio por kg', key: 'precio_kg' },
                        ].map(({ label, key }) => (
                            <div key={key}>
                                <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                                <input
                                    type="number"
                                    value={(editando as any)[key] || ''}
                                    onChange={e => setEditando({ ...editando, [key]: Number(e.target.value) })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                                />
                            </div>
                        ))}

                        <div className="flex items-center gap-3">
                            <label className="text-xs text-gray-500">Activo</label>
                            <button
                                onClick={() => setEditando({ ...editando, activo: !editando.activo })}
                                className={`w-10 h-6 rounded-full transition-colors ${editando.activo ? 'bg-amber-500' : 'bg-gray-700'}`}
                            >
                                <span className={`block w-4 h-4 bg-white rounded-full mx-1 transition-transform ${editando.activo ? 'translate-x-4' : ''}`} />
                            </button>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setEditando(null)}
                                className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={guardar}
                                disabled={guardando}
                                className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-medium text-sm"
                            >
                                {guardando ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}