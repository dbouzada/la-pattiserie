'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Confirm() {
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [listo, setListo] = useState(false)
    const router = useRouter()

    const guardar = async () => {
        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres')
            return
        }
        if (password !== confirm) {
            setError('Las contraseñas no coinciden')
            return
        }
        setLoading(true)
        const { error } = await supabase.auth.updateUser({ password })
        if (error) {
            setError('Error al actualizar la contraseña')
            setLoading(false)
            return
        }
        setListo(true)
        setTimeout(() => router.push('/'), 2000)
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0F1A09',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
        }}>
            <div style={{
                background: '#162210',
                border: '1px solid #2A4A1A',
                borderRadius: '20px',
                padding: '2.5rem',
                width: '100%',
                maxWidth: '380px',
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <img
                        src="/logo.png"
                        alt="La Pâtisserie"
                        style={{ width: '80px', height: '80px', borderRadius: '16px', objectFit: 'cover', margin: '0 auto 1rem' }}
                    />
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#E8E4D8', marginBottom: '0.25rem' }}>
                        Elegí tu contraseña
                    </h1>
                    <p style={{ fontSize: '0.8rem', color: '#8BAA6E' }}>
                        Bienvenido a La Pâtisserie
                    </p>
                </div>

                {listo ? (
                    <div style={{
                        background: '#4ADE8015', border: '1px solid #4ADE8030',
                        color: '#4ADE80', padding: '1rem',
                        borderRadius: '12px', textAlign: 'center', fontSize: '0.875rem',
                    }}>
                        ✓ Contraseña guardada — redirigiendo...
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {error && (
                            <div style={{
                                background: '#FF444415', border: '1px solid #FF444430',
                                color: '#FF8080', padding: '0.75rem 1rem',
                                borderRadius: '10px', fontSize: '0.8rem',
                            }}>
                                {error}
                            </div>
                        )}

                        <div>
                            <label style={{
                                fontSize: '0.72rem', color: '#8BAA6E', display: 'block',
                                marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.06em',
                            }}>
                                Nueva contraseña
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => { setPassword(e.target.value); setError('') }}
                                placeholder="Mínimo 6 caracteres"
                                style={{
                                    width: '100%', background: '#1E2E14',
                                    border: '1px solid #2A4A1A', borderRadius: '10px',
                                    padding: '0.75rem 1rem', color: '#E8E4D8',
                                    fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                                }}
                                onFocus={e => e.target.style.borderColor = '#C9A96E50'}
                                onBlur={e => e.target.style.borderColor = '#2A4A1A'}
                            />
                        </div>

                        <div>
                            <label style={{
                                fontSize: '0.72rem', color: '#8BAA6E', display: 'block',
                                marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.06em',
                            }}>
                                Confirmar contraseña
                            </label>
                            <input
                                type="password"
                                value={confirm}
                                onChange={e => { setConfirm(e.target.value); setError('') }}
                                placeholder="Repetí la contraseña"
                                style={{
                                    width: '100%', background: '#1E2E14',
                                    border: '1px solid #2A4A1A', borderRadius: '10px',
                                    padding: '0.75rem 1rem', color: '#E8E4D8',
                                    fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                                }}
                                onFocus={e => e.target.style.borderColor = '#C9A96E50'}
                                onBlur={e => e.target.style.borderColor = '#2A4A1A'}
                            />
                        </div>

                        <button
                            onClick={guardar}
                            disabled={loading}
                            style={{
                                width: '100%', padding: '0.875rem',
                                background: loading ? '#1E2E14' : '#C9A96E',
                                color: loading ? '#4A6A3A' : '#0F1A09',
                                border: 'none', borderRadius: '10px',