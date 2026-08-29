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
        <div style={{
            minHeight: '100vh',
            background: '#0A0A0F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
        }}>
            {/* Fondo con gradiente sutil */}
            <div style={{
                position: 'fixed',
                inset: 0,
                background: 'radial-gradient(ellipse at 50% 0%, #F59E0B08 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            <div style={{
                width: '100%',
                maxWidth: '380px',
                position: 'relative',
            }}>
                {/* Card */}
                <div style={{
                    background: '#0F0F18',
                    border: '1px solid #1E1E2E',
                    borderRadius: '20px',
                    padding: '2.5rem',
                    boxShadow: '0 25px 60px #00000060',
                }}>
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            background: '#F59E0B15',
                            border: '1px solid #F59E0B30',
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2rem',
                            margin: '0 auto 1rem',
                        }}>
                            🥐
                        </div>
                        <h1 style={{
                            fontSize: '1.25rem',
                            fontWeight: 600,
                            color: '#F0EDE6',
                            letterSpacing: '-0.02em',
                            marginBottom: '0.25rem',
                        }}>
                            La Pattiserie
                        </h1>
                        <p style={{ fontSize: '0.8rem', color: '#4A4A5A' }}>
                            Sistema de gestión
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{
                            background: '#FF444415',
                            border: '1px solid #FF444430',
                            color: '#FF8080',
                            padding: '0.75rem 1rem',
                            borderRadius: '10px',
                            fontSize: '0.8rem',
                            marginBottom: '1rem',
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Campos */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div>
                            <label style={{
                                fontSize: '0.72rem',
                                color: '#4A4A5A',
                                display: 'block',
                                marginBottom: '0.375rem',
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
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
                                    width: '100%',
                                    background: '#16161F',
                                    border: '1px solid #1E1E2E',
                                    borderRadius: '10px',
                                    padding: '0.75rem 1rem',
                                    color: '#E8E6E0',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    transition: 'border-color 0.15s',
                                }}
                                onFocus={e => e.target.style.borderColor = '#F59E0B50'}
                                onBlur={e => e.target.style.borderColor = '#1E1E2E'}
                            />
                        </div>

                        <div>
                            <label style={{
                                fontSize: '0.72rem',
                                color: '#4A4A5A',
                                display: 'block',
                                marginBottom: '0.375rem',
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
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
                                    width: '100%',
                                    background: '#16161F',
                                    border: '1px solid #1E1E2E',
                                    borderRadius: '10px',
                                    padding: '0.75rem 1rem',
                                    color: '#E8E6E0',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    transition: 'border-color 0.15s',
                                }}
                                onFocus={e => e.target.style.borderColor = '#F59E0B50'}
                                onBlur={e => e.target.style.borderColor = '#1E1E2E'}
                            />
                        </div>
                    </div>

                    {/* Botón */}
                    <button
                        onClick={login}
                        disabled={loading}
                        style={{
                            width: '100%',
                            marginTop: '1.5rem',
                            padding: '0.875rem',
                            background: loading ? '#2A2A35' : '#F59E0B',
                            color: loading ? '#4A4A5A' : '#0A0A0F',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.15s',
                            letterSpacing: '-0.01em',
                        }}
                        onMouseEnter={e => { if (!loading) (e.target as HTMLButtonElement).style.background = '#FBBF24' }}
                        onMouseLeave={e => { if (!loading) (e.target as HTMLButtonElement).style.background = '#F59E0B' }}
                    >
                        {loading ? 'Ingresando...' : 'Ingresar →'}
                    </button>
                </div>

                {/* Footer */}
                <p style={{
                    textAlign: 'center',
                    marginTop: '1.5rem',
                    fontSize: '0.72rem',
                    color: '#2A2A35',
                }}>
                    La Pattiserie © {new Date().getFullYear()}
                </p>
            </div>
        </div>
    )
}