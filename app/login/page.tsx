'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const login = async () => {
        setLoading(true)
        setError('')
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
            setError('Email o contraseña incorrectos')
            setLoading(false)
            return
        }
        router.push('/')
        router.refresh()
    }

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 w-full max-w-sm space-y-6">
                <div className="text-center">
                    <p className="text-4xl mb-2">🥐</p>
                    <h1 className="text-xl font-semibold text-white">La Pattiserie</h1>
                    <p className="text-gray-500 text-sm mt-1">Sistema de gestión</p>
                </div>

                {error && (
                    <div className="bg-red-900/50 border border-red-700 text-red-400 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && login()}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500"
                            placeholder="tu@email.com"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && login()}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <button
                    onClick={login}
                    disabled={loading}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-800 disabled:text-gray-600 text-black font-semibold rounded-xl transition-colors"
                >
                    {loading ? 'Entrando...' : 'Ingresar'}
                </button>
            </div>
        </div>
    )
}