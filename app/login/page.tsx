'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [tema, setTema] = useState<'oscuro' | 'claro'>('oscuro')
    const router = useRouter()

    useEffect(() => {
        const guardado = localStorage.getItem('tema') as 'oscuro' | 'claro'
        if (guardado) setTema(guardado)
    }, [])

    const c = {
        bg: tema === 'oscuro' ? '#0F1A09' : '#F7F5F0',
        card: tema === 'oscuro' ? '#162210' : '#FFFFFF',
        card2: tema === 'oscuro' ? '#1E2E14' : '#F0EDE4',
        border: tema === 'oscuro' ? '#2A4A1A' : '#E5E0D8',
        text: tema === 'oscuro' ? '#E8E4D8' : '#1A1A14',
        muted: tema === 'oscuro' ? '#8BAA6E' : '#9B9B8A',
        muted2: tema === 'oscuro' ? '#4A6A3A' : '#C5C0B0',
        input: tema === 'oscuro' ? '#1E2E14' : '#F7F5F0',
    }

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

    const toggleTema = () => {
        const nuevo = tema === 'oscuro' ? 'claro' : 'oscuro'
        setTema(nuevo)
        localStorage.setItem('tema', nuevo)
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: c.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            transition: 'background 0.2s',
        }}>
            {/* Fondo sutil */}
            <div style={{
                position: 'fixed', inset: 0,
                background: 'radial-gradient(ellipse at 50% 0%, #F59E0B08 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            {/* Toggle tema */}
            <button
                onClick={toggleTema}
                style={{
                    position: 'fixed', top: '1rem', right: '1rem',
                    background: c.card, border: `1px solid ${c.border}`,
                    borderRadius: '8px', padding: '0.375rem 0.75rem',
                    fontSize: '0.85rem', color: c.muted,
                    cursor: 'pointer', transition: 'all 0.15s',
                }}
            >
                {tema === 'oscuro' ? '☀️' : '🌙'}
            </button>

            <div style={{ width: '100%', maxWidth: '380px', position: 'relative' }}>
                <div style={{
                    background: c.card,
                    border: `1px solid ${c.border}`,
                    borderRadius: '20px',
                    padding: '2.5rem',
                    boxShadow: tema === 'oscuro' ? '0 25px 60px #00000060' : '0 25px 60px #00000015',
                }}>
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{
                            width: '64px', height: '64px',
                            background: '#F59E0B15',
                            border: '1px solid #F59E0B30',
                            borderRadius: '16px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2rem', margin: '0 auto 1rem',
                        }}>
                            🥐
                        </div>
                        <h1 style={{
                            fontSize: '1.25rem', fontWeight: 600, color: c.text,
                            letterSpacing: '-0.02em', marginBottom: '0.25rem',
                        }}>
                            La Pattiserie
                        </h1>
                        <p style={{ fontSize: '0.8rem', color: c.muted }}>Sistema de gestión</p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{
                            background: '#FF444415', border: '1px solid #FF444430',
                            color: '#FF8080', padding: '0.75rem 1rem',
                            borderRadius: '10px', fontSize: '0.8rem', marginBottom: '1rem',
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Campos */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div>
                            <label style={{
                                fontSize: '0.72rem', color: c.muted, display: 'block',
                                marginBottom: '0.375rem', letterSpacing: '0.05em', textTransform: 'uppercase',
                            }}>
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && login()}
                                placeholder="tu@email.com"
                                style={{
                                    width: '100%', background: c.input,
                                    border: `1px solid ${c.border}`, borderRadius: '10px',
                                    padding: '0.75rem 1rem', color: c.text,
                                    fontSize: '0.9rem', outline: 'none',
                                    transition: 'border-color 0.15s', boxSizing: 'border-box',
                                }}
                                onFocus={e => e.target.style.borderColor = '#F59E0B50'}
                                onBlur={e => e.target.style.borderColor = c.border}
                            />
                        </div>

                        <div>
                            <label style={{
                                fontSize: '0.72rem', color: c.muted, display: 'block',
                                marginBottom: '0.375rem', letterSpacing: '0.05em', textTransform: 'uppercase',
                            }}>
                                Contraseña
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && login()}
                                placeholder="••••••••"
                                style={{
                                    width: '100%', background: c.input,
                                    border: `1px solid ${c.border}`, borderRadius: '10px',
                                    padding: '0.75rem 1rem', color: c.text,
                                    fontSize: '0.9rem', outline: 'none',
                                    transition: 'border-color 0.15s', boxSizing: 'border-box',
                                }}
                                onFocus={e => e.target.style.borderColor = '#F59E0B50'}
                                onBlur={e => e.target.style.borderColor = c.border}
                            />
                        </div>
                    </div>

                    {/* Botón */}
                    <button
                        onClick={login}
                        disabled={loading}
                        style={{
                            width: '100%', marginTop: '1.5rem', padding: '0.875rem',
                            background: loading ? c.input : '#F59E0B',
                            color: loading ? c.muted : '#0A0A0F',
                            border: 'none', borderRadius: '10px',
                            fontSize: '0.9rem', fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.15s', letterSpacing: '-0.01em',
                        }}
                        onMouseEnter={e => { if (!loading) (e.currentTarget.style.background = '#FBBF24') }}
                        onMouseLeave={e => { if (!loading) (e.currentTarget.style.background = '#F59E0B') }}
                    >
                        {loading ? 'Ingresando...' : 'Ingresar →'}
                    </button>
                </div>

                <p style={{
                    textAlign: 'center', marginTop: '1.5rem',
                    fontSize: '0.72rem', color: c.muted,
                }}>
                    La Pattiserie © {new Date().getFullYear()}
                </p>
            </div>
        </div>
    )
}