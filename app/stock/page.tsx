'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Producto {
    id: number
    nombre: string
    stock: number
    activo: boolean
}

export default function Stock() {
    const [productos, setProductos] = useState<Producto[]>([])
    const [loading, setLoading] = useState(true)
    const [ajustes, setAjustes] = useState<Record<number, number>>({})
    const [guardando, setGuardando] = useState<number | null>(null)
    const [busqueda, setBusqueda] = useState('')

    const cargar = async () => {
        const { data } = await supabase
            .from('productos')
            .select('id, nombre, stock, activo')
            .eq('activo', true)
            .order('nombre')
        setProductos(data || [])
        setLoading(false)
    }

    useEffect(() => { cargar() }, [])

    const ajustar = async (id: number, nuevoStock: number) => {
        setGuardando(id)
        await supabase.from('productos').update({ stock: nuevoStock }).eq('id', id)
        await cargar()
        setAjustes(prev => { const n = { ...prev }; delete n[id]; return n })
        setGuardando(null)
    }

    const filtrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    )

    const criticos = productos.filter(p => p.stock <= 0)

    if (loading) return <p className="text-gray-400">Cargando...</p>

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-amber-400">Stock</h1>
                {criticos.length > 0 && (
                    <span className="text-xs bg-red-900 text-red-400 px-3 py-1 rounded-full">
                        {criticos.length} sin stock
                    </span>
                )}
            </div>

            <input
                type="text"
                placeholder="Buscar producto..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
            />

            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-gray-500 text-xs border-b border-gray-800">
                            <th className="text-left px-4 py-3">Producto</th>
                            <th className="text-right px-4 py-3">Stock actual</th>
                            <th className="text-right px-4 py-3">Nuevo stock</th>
                            <th className="px-4 py-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtrados.map(p => {
                            const nuevo = ajustes[p.id] ?? p.stock
                            const cambio = nuevo !== p.stock
                            return (
                                <tr key={p.id} className="border-b border-gray-800 last:border-0">
                                    <td className="px-4 py-3 text-white">{p.nombre}</td>
                                    <td className="px-4 py-3 text-right">
                                        <span className={`font-medium ${p.stock <= 0 ? 'text-red-400' :
                                                p.stock < 10 ? 'text-orange-400' :
                                                    'text-gray-300'
                                            }`}>
                                            {p.stock}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <input
                                            type="number"
                                            value={nuevo}
                                            onChange={e => setAjustes({ ...ajustes, [p.id]: Number(e.target.value) })}
                                            className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-right focus:outline-none focus:border-amber-500"
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => ajustar(p.id, nuevo)}
                                            disabled={!cambio || guardando === p.id}
                                            className={`text-xs px-3 py-1 rounded transition-colors ${cambio
                                                    ? 'bg-amber-500 hover:bg-amber-400 text-black font-medium'
                                                    : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                                }`}
                                        >
                                            {guardando === p.id ? '...' : 'Guardar'}
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}