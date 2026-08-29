'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Tema = 'oscuro' | 'claro'

const TemaContext = createContext<{
    tema: Tema
    toggleTema: () => void
}>({ tema: 'oscuro', toggleTema: () => { } })

export function TemaProvider({ children }: { children: React.ReactNode }) {
    const [tema, setTema] = useState<Tema>('oscuro')

    useEffect(() => {
        const guardado = localStorage.getItem('tema') as Tema
        if (guardado) setTema(guardado)
    }, [])

    const toggleTema = () => {
        const nuevo = tema === 'oscuro' ? 'claro' : 'oscuro'
        setTema(nuevo)
        localStorage.setItem('tema', nuevo)
    }

    return (
        <TemaContext.Provider value={{ tema, toggleTema }}>
            <div data-tema={tema} style={{ minHeight: '100vh', background: tema === 'oscuro' ? '#0A0A0F' : '#F5F4F0', color: tema === 'oscuro' ? '#E8E6E0' : '#1A1A1F', transition: 'background 0.2s, color 0.2s' }}>
                {children}
            </div>
        </TemaContext.Provider>
    )
}

export const useTema = () => useContext(TemaContext)