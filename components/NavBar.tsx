'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useTema } from '@/lib/theme'

const links = [
    { href: '/', label: 'Dashboard', icon: '◈' },
    { href: '/ventas/nueva', label: 'Nueva venta', icon: '＋' },
    { href: '/ventas', label: 'Ventas', icon: '◉' },
    { href: '/productos', label: 'Productos', icon: '▦' },
    { href: '/stock', label: 'Stock', icon: '◧' },
    { href: '/caja', label: 'Caja', icon: '◎' },
    { href: '/clientes', label: 'Clientes', icon: '◑' },
]

export default function NavBar() {
    const pathname = usePathname()
    const router = useRouter()
    const { tema, toggleTema } = useTema()

    const bg = tema === 'oscuro' ? '#0F0F18' : '#FFFFFF'
    const border = tema === 'oscuro' ? '#1E1E2E' : '#E5E4E0'
    const textMuted = tema === 'oscuro' ? '#6B6B80' : '#9B9B9B'

    if (pathname === '/login') return null

    const logout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <nav style={{
            background: bg,
            borderBottom: `1px solid ${border}`,
            position: 'sticky',
            top: 0,
            zIndex: 50,
            transition: 'background 0.2s',
        }}>
            <div style={{
                maxWidth: '80rem',
                margin: '0 auto',
                padding: '0 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                height: '56px',
            }}>
                <Link href="/" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginRight: '1rem',
                    textDecoration: 'none',
                }}>
                    <span style={{ fontSize: '1.5rem' }}>🥐</span>
                    <span style={{
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        color: '#F59E0B',
                        letterSpacing: '-0.01em',
                    }}>La Pattiserie</span>
                </Link>

                <div style={{ display: 'flex', gap: '0.25rem', flex: 1 }}>
                    {links.map(link => {
                        const active = pathname === link.href
                        return (
                            <Link key={link.href} href={link.href} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                padding: '0.375rem 0.75rem',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                fontWeight: active ? 500 : 400,
                                color: active ? '#F59E0B' : textMuted,
                                background: active ? '#F59E0B15' : 'transparent',
                                textDecoration: 'none',
                                transition: 'all 0.15s',
                                border: active ? '1px solid #F59E0B30' : '1px solid transparent',
                            }}>
                                <span style={{ fontSize: '0.7rem' }}>{link.icon}</span>
                                {link.label}
                            </Link>
                        )
                    })}
                </div>

                {/* Toggle tema */}
                <button
                    onClick={toggleTema}
                    style={{
                        padding: '0.375rem 0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        color: textMuted,
                        background: 'transparent',
                        border: `1px solid ${border}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                    }}
                    title={tema === 'oscuro' ? 'Modo claro' : 'Modo oscuro'}
                >
                    {tema === 'oscuro' ? '☀️' : '🌙'}
                </button>

                <button onClick={logout} style={{
                    padding: '0.375rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    color: textMuted,
                    background: 'transparent',
                    border: `1px solid ${border}`,
                    cursor: 'pointer',
                }}>
                    Salir
                </button>
            </div>
        </nav>
    )
}