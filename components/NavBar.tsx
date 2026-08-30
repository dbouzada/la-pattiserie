'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useTema } from '@/lib/theme'
import Image from 'next/image'

const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/ventas/nueva', label: 'Nueva venta' },
    { href: '/ventas', label: 'Ventas' },
    { href: '/productos', label: 'Productos' },
    { href: '/stock', label: 'Stock' },
    { href: '/caja', label: 'Caja' },
    { href: '/clientes', label: 'Clientes' },
]

export default function NavBar() {
    const pathname = usePathname()
    const router = useRouter()
    const { tema, toggleTema } = useTema()

    const bg = tema === 'oscuro' ? '#1A2E0F' : '#FFFFFF'
    const border = tema === 'oscuro' ? '#2A4A1A' : '#E5E0D8'
    const textMuted = tema === 'oscuro' ? '#8BAA6E' : '#9B9B8A'
    const activeColor = '#C9A96E'
    const activeBg = '#C9A96E18'
    const activeBorder = '#C9A96E35'

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

                {/* Logo */}
                <Link href="/" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    marginRight: '1rem',
                    textDecoration: 'none',
                    flexShrink: 0,
                }}>
                    <Image
                        src="/logo.png"
                        alt="La Pâtisserie"
                        width={36}
                        height={36}
                        style={{ borderRadius: '8px', objectFit: 'cover' }}
                    />
                    <div style={{ lineHeight: 1.1 }}>
                        <span style={{
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            color: '#C9A96E',
                            letterSpacing: '-0.01em',
                            display: 'block',
                        }}>La Pâtisserie</span>
                        <span style={{
                            fontSize: '0.65rem',
                            color: textMuted,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                        }}>Délice Artisanal</span>
                    </div>
                </Link>

                {/* Links */}
                <div style={{ display: 'flex', gap: '0.25rem', flex: 1 }}>
                    {links.map(link => {
                        const active = pathname === link.href
                        return (
                            <Link key={link.href} href={link.href} style={{
                                padding: '0.375rem 0.75rem',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                fontWeight: active ? 600 : 400,
                                color: active ? activeColor : textMuted,
                                background: active ? activeBg : 'transparent',
                                textDecoration: 'none',
                                transition: 'all 0.15s',
                                border: active ? `1px solid ${activeBorder}` : '1px solid transparent',
                                whiteSpace: 'nowrap',
                            }}>
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
                        flexShrink: 0,
                    }}
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
                    flexShrink: 0,
                }}>
                    Salir
                </button>
            </div>
        </nav>
    )
}