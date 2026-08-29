'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const links = [
    { href: '/', label: 'Dashboard', icon: '◈' },
    { href: '/ventas/nueva', label: 'Nueva venta', icon: '＋' },
    { href: '/ventas', label: 'Ventas', icon: '◉' },
    { href: '/productos', label: 'Productos', icon: '▦' },
    { href: '/stock', label: 'Stock', icon: '◧' },
    { href: '/caja', label: 'Caja', icon: '◎' },
]

export default function NavBar() {
    const pathname = usePathname()
    const router = useRouter()

    if (pathname === '/login') return null

    const logout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <nav style={{
            background: '#0F0F18',
            borderBottom: '1px solid #1E1E2E',
            position: 'sticky',
            top: 0,
            zIndex: 50,
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
                {/* Logo */}
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

                {/* Links */}
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
                                color: active ? '#F59E0B' : '#6B6B80',
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

                {/* Logout */}
                <button onClick={logout} style={{
                    padding: '0.375rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    color: '#6B6B80',
                    background: 'transparent',
                    border: '1px solid #1E1E2E',
                    cursor: 'pointer',
                }}>
                    Salir
                </button>
            </div>
        </nav>
    )
}