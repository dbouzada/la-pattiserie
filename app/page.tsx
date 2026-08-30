'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTema } from '@/lib/theme'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const { tema } = useTema()
  const [hoy, setHoy] = useState<any>(null)
  const [topProductos, setTopProductos] = useState<any[]>([])
  const [semana, setSemana] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    async function cargar() {
      const hoyStr = new Date().toISOString().split('T')[0]

      const { data: resumen } = await supabase
        .from('resumen_diario').select('*').eq('fecha', hoyStr).single()

      const { data: top } = await supabase
        .from('top_productos').select('*').limit(6)

      const { data: ultimos } = await supabase
        .from('resumen_diario')
        .select('fecha, total_dia, cantidad_tickets')
        .order('fecha', { ascending: false })
        .limit(7)

      setHoy(resumen)
      setTopProductos(top || [])
      setSemana((ultimos || []).reverse().map(d => ({
        fecha: new Date(d.fecha).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' }),
        total: d.total_dia,
        tickets: d.cantidad_tickets,
      })))
      setLoading(false)
    }
    cargar()
  }, [])

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ color: c.muted2, fontSize: '0.9rem' }}>Cargando...</div>
    </div>
  )

  const kpis = [
    { label: 'Total del día', value: fmt(hoy?.total_dia || 0), color: '#4ADE80', bg: '#4ADE8010', border: '#4ADE8025' },
    { label: 'Tickets', value: hoy?.cantidad_tickets || 0, color: '#60A5FA', bg: '#60A5FA10', border: '#60A5FA25' },
    { label: 'Efectivo', value: fmt(hoy?.efectivo || 0), color: '#FBBF24', bg: '#FBBF2410', border: '#FBBF2425' },
    { label: 'Digital', value: fmt((hoy?.tarjeta || 0) + (hoy?.transferencia || 0) + (hoy?.mercadopago || 0) + (hoy?.pedidosya || 0)), color: '#A78BFA', bg: '#A78BFA10', border: '#A78BFA25' },
  ]

  const medios = [
    { label: 'Efectivo', value: hoy?.efectivo || 0, color: '#FBBF24' },
    { label: 'Tarjeta', value: hoy?.tarjeta || 0, color: '#60A5FA' },
    { label: 'Transferencia', value: hoy?.transferencia || 0, color: '#A78BFA' },
    { label: 'Mercado Pago', value: hoy?.mercadopago || 0, color: '#34D399' },
    { label: 'Pedidos Ya', value: hoy?.pedidosya || 0, color: '#F87171' },
  ].filter(m => m.value > 0)

  const totalMedios = medios.reduce((a, m) => a + m.value, 0)

  return (
    <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: c.text, letterSpacing: '-0.03em' }}>
            Buenos días 👋
          </h1>
          <p style={{ fontSize: '0.8rem', color: c.muted, marginTop: '0.2rem' }}>
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <a href="/ventas/nueva" style={{
          background: '#F59E0B', color: '#0A0A0F',
          padding: '0.6rem 1.2rem', borderRadius: '10px',
          fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none',
        }}>
          + Nueva venta
        </a>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {kpis.map(k => (
          <div key={k.label} style={{
            background: k.bg, border: `1px solid ${k.border}`,
            borderRadius: '16px', padding: '1.25rem 1.5rem',
          }}>
            <p style={{ fontSize: '0.72rem', color: c.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
              {k.label}
            </p>
            <p style={{ fontSize: '1.6rem', fontWeight: 700, color: k.color, letterSpacing: '-0.03em', lineHeight: 1 }}>
              {k.value}
            </p>
          </div>
        ))}
      </div>

      {/* Gráfico + Medios */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>

        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '16px', padding: '1.5rem' }}>
          <p style={{ fontSize: '0.8rem', color: c.muted, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Últimos 7 días
          </p>
          {semana.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={semana} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="fecha" tick={{ fill: c.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: c.card2, border: `1px solid ${c.border}`, borderRadius: '8px', fontSize: '0.8rem' }}
                  labelStyle={{ color: c.muted }}
                  itemStyle={{ color: '#F59E0B' }}
                  formatter={(v: any) => [fmt(Number(v)), 'Total']}
                />
                <Area type="monotone" dataKey="total" stroke="#F59E0B" strokeWidth={2} fill="url(#grad)" dot={{ fill: '#F59E0B', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.muted2, fontSize: '0.85rem' }}>
              Sin datos aún
            </div>
          )}
        </div>

        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '16px', padding: '1.5rem' }}>
          <p style={{ fontSize: '0.8rem', color: c.muted, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Medios de pago hoy
          </p>
          {medios.length === 0 ? (
            <div style={{ color: c.muted2, fontSize: '0.85rem', marginTop: '2rem', textAlign: 'center' }}>Sin ventas aún</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {medios.map(m => (
                <div key={m.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.8rem', color: c.muted }}>{m.label}</span>
                    <span style={{ fontSize: '0.8rem', color: m.color, fontWeight: 500 }}>{fmt(m.value)}</span>
                  </div>
                  <div style={{ height: '4px', background: c.border, borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${(m.value / totalMedios) * 100}%`,
                      background: m.color,
                      borderRadius: '4px',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top productos */}
      <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '16px', padding: '1.5rem' }}>
        <p style={{ fontSize: '0.8rem', color: c.muted, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Top productos
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
          {topProductos.map((p, i) => (
            <div key={i} style={{
              background: c.card2, border: `1px solid ${c.border}`,
              borderRadius: '12px', padding: '1rem',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              <div style={{
                width: '32px', height: '32px',
                background: '#F59E0B15', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700, color: '#F59E0B', flexShrink: 0,
              }}>
                #{i + 1}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ fontSize: '0.8rem', color: c.text, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.nombre}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#4ADE80', marginTop: '0.1rem' }}>
                  {fmt(p.ingresos_totales)}
                </p>
              </div>
            </div>
          ))}
          {topProductos.length === 0 && (
            <div style={{ gridColumn: 'span 3', textAlign: 'center', color: c.muted2, padding: '2rem', fontSize: '0.85rem' }}>
              Sin ventas aún
            </div>
          )}
        </div>
      </div>
    </div>
  )
}