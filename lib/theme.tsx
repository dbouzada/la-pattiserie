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
            <div data-tema={tema} style={{
                minHeight: '100vh',
                background: tema === 'oscuro' ? '#0F1A09' : '#F7F5F0',
                color: tema === 'oscuro' ? '#E8E4D8' : '#1A1A14',
                transition: 'background 0.2s, color 0.2s',
            }}>
                {children}
            </div>
        </TemaContext.Provider>
    )
}

export const useTema = () => useContext(TemaContext)