'use client'

import { useState } from 'react'
import { useTema } from '@/lib/theme'
import IngredientesTab from '@/components/Costos/IngredientesTab'
import RecetasTab from '@/components/Costos/RecetasTab'
import CalculadoraTab from '@/components/Costos/CalculadoraTab'

const TABS = [
    { id: 'ingredientes', label: 'Ingredientes' },
    { id: 'recetas', label: 'Recetas y preparaciones' },
    { id: 'calculadora', label: 'Calculadora' },
] as const

type TabId = (typeof TABS)[number]['id']

export default function Costos() {
    const { tema } = useTema()
    const [tab, setTab] = useState<TabId>('ingredientes')

    const c = {
        card: tema === 'oscuro' ? '#162210' : '#F7F3EC',
        border: tema === 'oscuro' ? '#2A4A1A' : '#C8BFA8',
        text: tema === 'oscuro' ? '#E8E4D8' : '#1A1A14',
        muted: tema === 'oscuro' ? '#8BAA6E' : '#6B6550',
        muted2: tema === 'oscuro' ? '#4A6A3A' : '#9B9280',
    }

    return (
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: c.text, letterSpacing: '-0.03em' }}>Costos</h1>
                <p style={{ fontSize: '0.8rem', color: c.muted, marginTop: '0.2rem' }}>
                    Ingredientes, recetas y precios de venta
                </p>
            </div>

            <div role="tablist" style={{
                display: 'flex', gap: '0.25rem', padding: '0.25rem',
                background: c.card, border: `1px solid ${c.border}`, borderRadius: '12px', overflowX: 'auto',
            }}>
                {TABS.map(t => {
                    const activo = tab === t.id
                    return (
                        <button
                            key={t.id}
                            role="tab"
                            aria-selected={activo}
                            onClick={() => setTab(t.id)}
                            style={{
                                flex: 1, padding: '0.5rem 0.75rem', borderRadius: '9px',
                                fontSize: '0.82rem', fontWeight: activo ? 600 : 400, whiteSpace: 'nowrap',
                                color: activo ? '#C9A96E' : c.muted,
                                background: activo ? '#C9A96E18' : 'transparent',
                                border: activo ? '1px solid #C9A96E35' : '1px solid transparent',
                                cursor: 'pointer', transition: 'all 0.15s',
                            }}
                        >
                            {t.label}
                        </button>
                    )
                })}
            </div>

            {tab === 'ingredientes' && <IngredientesTab />}
            {tab === 'recetas' && <RecetasTab />}
            {tab === 'calculadora' && <CalculadoraTab />}
        </div>
    )
}