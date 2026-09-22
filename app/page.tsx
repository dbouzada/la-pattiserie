'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTema } from '@/lib/theme'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

export default function Dashboard() {
  const { tema } = useTema()
  const [metricas, setMetricas] = useState<any>(null)
  const [metricasAyer, setMetricasAyer] = useState<any>(null)
  const [topProductos, setTopProductos] = useState<any[]>([])
  const [semana, setSemana] = useState<any[]>([])
  const [horasPico, setHorasPico] = useState<any[]>([])
  const [stockCritico, setStockCritico] = useState<number>(0)
  const [sociosNuevosMes, setSociosNuevosMes] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [fechaDesde, setFechaDesde] = useState(new Date().toISOString().split('T')[0])
  const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split('T')[0])

  const c = {
    bg: tema === 'oscuro' ? '#0F1A09' : '#EDE8DF',
    card: tema === 'oscuro' ? '#162210' : '#F7F3EC',
    card2: tema === 'oscuro' ? '#1E2E14' : '#EDE8DF',
    border: tema === 'oscuro' ? '#2A4A1A' : '#C8BFA8',
    text: tema === 'oscuro' ? '#E8E4D8' : '#1A1A14',
    muted: tema === 'oscuro' ? '#8BAA6E' : '#6B6550',
    muted2: tema === 'oscuro' ? '#4A6A3A' : '#9B9280',
    input: tema === 'oscuro' ? '#1E2E14' : '#F7F3EC',
  }

  useEffect(() => {
    async function cargar() {
      setLoading(true)

      // Métricas del período seleccionado
      const { data: metricasPeriodo } = await supabase
        .from('metricas_diarias')
        .select('*')
        .gte('fecha', fechaDesde)
        .lte('fecha', fechaHasta)

      const agregado = metricasPeriodo?.reduce((acc: any, d: any) => ({
        tickets: (acc.tickets || 0) + (d.tickets || 0),
        total_dia: (acc.total_dia || 0) + (d.total_dia || 0),
        socios_compraron: (acc.socios_compraron || 0) + (d.socios_compraron || 0),
        ventas_socios: (acc.ventas_socios || 0) + (d.ventas_socios || 0),
        ventas_con_dni: (acc.ventas_con_dni || 0) + (d.ventas_con_dni || 0),
        margen_estimado: (acc.margen_estimado || 0) + (d.margen_estimado || 0),
        total_efectivo: (acc.total_efectivo || 0) + (d.total_efectivo || 0),
        total_tarjeta: (acc.total_tarjeta || 0) + (d.total_tarjeta || 0),
        total_transferencia: (acc.total_transferencia || 0) + (d.total_transferencia || 0),
        total_mercadopago: (acc.total_mercadopago || 0) + (d.total_mercadopago || 0),
        total_pedidosya: (acc.total_pedidosya || 0) + (d.total_pedidosya || 0),
        total_rappi: (acc.total_rappi || 0) + (d.total_rappi || 0),
      }), {})

      if (agregado && agregado.tickets > 0) {
        agregado.ticket_promedio = Math.round(agregado.total_dia / agregado.tickets)
      }

      setMetricas(agregado || null)

      // Métricas de ayer para comparación (solo cuando el período es un día)
      if (fechaDesde === fechaHasta) {
        const ayer = new Date(fechaDesde)
        ayer.setDate(ayer.getDate() - 1)
        const ayerStr = ayer.toISOString().split('T')[0]
        const { data: metAyer } = await supabase
          .from('metricas_diarias')
          .select('total_dia, tickets, ticket_promedio')
          .eq('fecha', ayerStr)
          .single()
        setMetricasAyer(metAyer)
      } else {
        setMetricasAyer(null)
      }

      // Top productos histórico
      const { data: top } = await supabase
        .from('top_productos').select('*').limit(6)
      setTopProductos(top || [])

      // Ventas por día del período
      const { data: ultimos } = await supabase
        .from('metricas_diarias')
        .select('fecha, total_dia, tickets')
        .gte('fecha', fechaDesde)
        .lte('fecha', fechaHasta)
        .order('fecha', { ascending: true })
      setSemana((ultimos || []).map((d: any) => ({
        fecha: new Date(d.fecha + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }),
        total: d.total_dia,
        tickets: d.tickets,
      })))

      // Horas pico del período
      const { data: horas } = await supabase
        .from('ventas_por_hora')
        .select('hora, cantidad, total')
        .gte('fecha', fechaDesde)
        .lte('fecha', fechaHasta)

      const horasAgregadas: Record<number, { cantidad: number; total: number }> = {}
      horas?.forEach((h: any) => {
        const hora = Number(h.hora)
        if (!horasAgregadas[hora]) horasAgregadas[hora] = { cantidad: 0, total: 0 }
        horasAgregadas[hora].cantidad += h.cantidad
        horasAgregadas[hora].total += h.total
      })
      const horasArr = Object.entries(horasAgregadas)
        .map(([hora, v]) => ({ hora: `${hora}hs`, cantidad: v.cantidad, total: v.total }))
        .sort((a, b) => Number(a.hora) - Number(b.hora))
      setHorasPico(horasArr)

      // Stock crítico
      const { count } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true })
        .eq('activo', true)
        .lte('stock', 0)
      setStockCritico(count || 0)

      // Socios nuevos este mes
      const inicioMes = new Date()
      inicioMes.setDate(1)
      const { count: nuevosMes } = await supabase
        .from('socios')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', inicioMes.toISOString())
      setSociosNuevosMes(nuevosMes || 0)

      setLoading(false)
    }
    cargar()
  }, [fechaDesde, fechaHasta])

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

  const variacion = (actual: number, anterior: number) => {
    if (!anterior || anterior === 0) return null
    const pct = ((actual - anterior) / anterior) * 100
    return pct
  }

  const Variacion = ({ actual, anterior }: { actual: number; anterior: number }) => {
    const pct = variacion(actual, anterior)
    if (pct === null) return null
    const sube = pct >= 0
    return (
      <span style={{
        fontSize: '0.72rem', fontWeight: 600,
        color: sube ? '#4ADE80' : '#F87171',
        background: sube ? '#4ADE8015' : '#F8717115',
        padding: '0.15rem 0.5rem', borderRadius: '6px', marginLeft: '0.5rem',
      }}>
        {sube ? '↑' : '↓'} {Math.abs(pct).toFixed(1)}%
      </span>
    )
  }

  const tituloFecha = fechaDesde === fechaHasta
    ? new Date(fechaDesde + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
    : `${new Date(fechaDesde + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} → ${new Date(fechaHasta + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}`

  const horaPico = horasPico.length > 0
    ? horasPico.reduce((a, b) => a.cantidad > b.cantidad ? a : b)
    : null

  const pctSocios = metricas?.total_dia > 0
    ? ((metricas.ventas_socios || 0) / metricas.total_dia * 100).toFixed(0)
    : 0

  return (
    <>
      <style>{`
        .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
        .grid-2 { display: grid; grid-template-columns: 2fr 1fr; gap: 1rem; }
        .grid-2-eq { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .grid-top { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
        .fecha-row { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
        @media (max-width: 900px) {
          .grid-4 { grid-template-columns: repeat(2, 1fr); }
          .grid-3 { grid-template-columns: repeat(2, 1fr); }
          .grid-2 { grid-template-columns: 1fr; }
          .grid-2-eq { grid-template-columns: 1fr; }
          .grid-top { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .grid-4 { grid-template-columns: repeat(2, 1fr); }
          .grid-3 { grid-template-columns: 1fr; }
          .grid-top { grid-template-columns: 1fr; }
        }
      `}</style>

      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: c.text, letterSpacing: '-0.03em' }}>Dashboard</h1>
            <p style={{ fontSize: '0.8rem', color: c.muted, marginTop: '0.2rem' }}>{tituloFecha}</p>
          </div>
          <div className="fecha-row">
            <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
              style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '10px', padding: '0.5rem 0.875rem', color: c.text, fontSize: '0.85rem', outline: 'none' }} />
            <span style={{ color: c.muted, fontSize: '0.85rem' }}>→</span>
            <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
              style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '10px', padding: '0.5rem 0.875rem', color: c.text, fontSize: '0.85rem', outline: 'none' }} />
            <a href="/ventas/nueva" style={{
              background: '#C9A96E', color: '#0F1A09', padding: '0.6rem 1.2rem',
              borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap',
            }}>+ Nueva venta</a>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
            <div style={{ color: c.muted2, fontSize: '0.9rem' }}>Cargando...</div>
          </div>
        ) : (
          <>
            {/* KPIs principales */}
            <div className="grid-4">
              {[
                {
                  label: 'Total del período', value: fmt(metricas?.total_dia || 0),
                  color: '#4ADE80', bg: '#4ADE8010', border: '#4ADE8025',
                  comp: metricasAyer ? <Variacion actual={metricas?.total_dia || 0} anterior={metricasAyer.total_dia} /> : null,
                  sub: metricasAyer ? `Ayer: ${fmt(metricasAyer.total_dia || 0)}` : null,
                },
                {
                  label: 'Tickets', value: metricas?.tickets || 0,
                  color: '#60A5FA', bg: '#60A5FA10', border: '#60A5FA25',
                  comp: metricasAyer ? <Variacion actual={metricas?.tickets || 0} anterior={metricasAyer.tickets} /> : null,
                  sub: metricasAyer ? `Ayer: ${metricasAyer.tickets || 0}` : null,
                },
                {
                  label: 'Ticket promedio', value: fmt(metricas?.ticket_promedio || 0),
                  color: '#C9A96E', bg: '#C9A96E10', border: '#C9A96E25',
                  comp: metricasAyer ? <Variacion actual={metricas?.ticket_promedio || 0} anterior={metricasAyer.ticket_promedio} /> : null,
                  sub: metricasAyer ? `Ayer: ${fmt(metricasAyer.ticket_promedio || 0)}` : null,
                },
                {
                  label: 'Margen estimado', value: fmt(metricas?.margen_estimado || 0),
                  color: '#A78BFA', bg: '#A78BFA10', border: '#A78BFA25',
                  comp: null, sub: metricas?.total_dia > 0
                    ? `${((metricas.margen_estimado / metricas.total_dia) * 100).toFixed(0)}% del total`
                    : null,
                },
              ].map(k => (
                <div key={k.label} style={{
                  background: k.bg, border: `1px solid ${k.border}`,
                  borderRadius: '16px', padding: '1rem 1.25rem',
                }}>
                  <p style={{ fontSize: '0.68rem', color: c.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
                    {k.label}
                  </p>
                  <p style={{ fontSize: '1.4rem', fontWeight: 700, color: k.color, letterSpacing: '-0.03em', lineHeight: 1 }}>
                    {k.value}{k.comp}
                  </p>
                  {k.sub && <p style={{ fontSize: '0.72rem', color: c.muted2, marginTop: '0.3rem' }}>{k.sub}</p>}
                </div>
              ))}
            </div>

            {/* Segunda fila — socios + stock + facturable */}
            <div className="grid-3">
              {[
                {
                  label: 'Socios que compraron', value: metricas?.socios_compraron || 0,
                  color: '#34D399', bg: '#34D39910', border: '#34D39925',
                  sub: `${pctSocios}% de las ventas · ${fmt(metricas?.ventas_socios || 0)}`,
                },
                {
                  label: 'Ventas facturables (con DNI)', value: fmt(metricas?.ventas_con_dni || 0),
                  color: '#F59E0B', bg: '#F59E0B10', border: '#F59E0B25',
                  sub: metricas?.total_dia > 0
                    ? `${((metricas.ventas_con_dni / metricas.total_dia) * 100).toFixed(0)}% del total`
                    : '0% del total',
                },
                {
                  label: 'Stock crítico (en 0)', value: stockCritico,
                  color: stockCritico > 0 ? '#F87171' : '#4ADE80',
                  bg: stockCritico > 0 ? '#F8717110' : '#4ADE8010',
                  border: stockCritico > 0 ? '#F8717125' : '#4ADE8025',
                  sub: stockCritico > 0 ? 'Revisar stock urgente' : 'Todo en orden',
                },
              ].map(k => (
                <div key={k.label} style={{
                  background: k.bg, border: `1px solid ${k.border}`,
                  borderRadius: '16px', padding: '1rem 1.25rem',
                }}>
                  <p style={{ fontSize: '0.68rem', color: c.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
                    {k.label}
                  </p>
                  <p style={{ fontSize: '1.4rem', fontWeight: 700, color: k.color, letterSpacing: '-0.03em', lineHeight: 1 }}>
                    {k.value}
                  </p>
                  <p style={{ fontSize: '0.72rem', color: c.muted2, marginTop: '0.3rem' }}>{k.sub}</p>
                </div>
              ))}
            </div>

            {/* Gráfico ventas + hora pico */}
            <div className="grid-2">
              <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '16px', padding: '1.25rem' }}>
                <p style={{ fontSize: '0.75rem', color: c.muted, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Ventas por día
                </p>
                {semana.length > 0 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={semana} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#C9A96E" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#C9A96E" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="fecha" tick={{ fill: c.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{ background: c.card2, border: `1px solid ${c.border}`, borderRadius: '8px', fontSize: '0.8rem' }}
                        labelStyle={{ color: c.muted }}
                        itemStyle={{ color: '#C9A96E' }}
                        formatter={(v: any) => [fmt(Number(v)), 'Total']}
                      />
                      <Area type="monotone" dataKey="total" stroke="#C9A96E" strokeWidth={2} fill="url(#grad)" dot={{ fill: '#C9A96E', r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.muted2, fontSize: '0.85rem' }}>
                    Sin datos para este período
                  </div>
                )}
              </div>

              <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '16px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.75rem', color: c.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Hora pico
                  </p>
                  {horaPico && (
                    <span style={{
                      fontSize: '0.72rem', color: '#C9A96E',
                      background: '#C9A96E15', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 600,
                    }}>
                      Pico: {horaPico.hora}
                    </span>
                  )}
                </div>
                {horasPico.length > 0 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={horasPico} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <XAxis dataKey="hora" tick={{ fill: c.muted, fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{ background: c.card2, border: `1px solid ${c.border}`, borderRadius: '8px', fontSize: '0.8rem' }}
                        labelStyle={{ color: c.muted }}
                        formatter={(v: any) => [fmt(Number(v)), 'tickets']}
                      />
                      <Bar dataKey="cantidad" fill="#C9A96E" radius={[4, 4, 0, 0]} opacity={0.8} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.muted2, fontSize: '0.85rem' }}>
                    Sin datos
                  </div>
                )}
              </div>
            </div>

            {/* Socios nuevos + medios de pago */}
            <div className="grid-2-eq">
              <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '16px', padding: '1.25rem' }}>
                <p style={{ fontSize: '0.75rem', color: c.muted, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Club de socios
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {[
                    { label: 'Socios nuevos este mes', value: sociosNuevosMes, color: '#34D399' },
                    { label: 'Compraron en el período', value: metricas?.socios_compraron || 0, color: '#C9A96E' },
                    { label: 'Vendido a socios', value: fmt(metricas?.ventas_socios || 0), color: '#60A5FA' },
                  ].map(m => (
                    <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', color: c.muted }}>{m.label}</span>
                      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: m.color }}>{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '16px', padding: '1.25rem' }}>
                <p style={{ fontSize: '0.75rem', color: c.muted, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Medios de pago
                </p>
                {(() => {
                  const mediosData = [
                    { label: 'Efectivo', color: '#C9A96E', key: 'efectivo' },
                    { label: 'Tarjeta', color: '#60A5FA', key: 'tarjeta' },
                    { label: 'Transferencia', color: '#A78BFA', key: 'transferencia' },
                    { label: 'Mercado Pago', color: '#34D399', key: 'mercadopago' },
                    { label: 'Pedidos Ya', color: '#F87171', key: 'pedidosya' },
                    { label: 'Rappi', color: '#FF6B35', key: 'rappi' },
                  ]

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {mediosData.map(m => {
                        const valor = (metricas as any)?.[`total_${m.key}`] || 0
                        if (valor === 0) return null
                        const pct = metricas?.total_dia > 0 ? (valor / metricas.total_dia * 100).toFixed(0) : 0
                        return (
                          <div key={m.key}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                              <span style={{ fontSize: '0.78rem', color: c.muted }}>{m.label}</span>
                              <span style={{ fontSize: '0.78rem', color: m.color, fontWeight: 500 }}>{pct}% · {fmt(valor)}</span>
                            </div>
                            <div style={{ height: '3px', background: c.border, borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: m.color, borderRadius: '3px' }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Top productos */}
            <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '16px', padding: '1.25rem' }}>
              <p style={{ fontSize: '0.75rem', color: c.muted, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Top productos (histórico)
              </p>
              <div className="grid-top">
                {topProductos.map((p, i) => (
                  <div key={i} style={{
                    background: c.card2, border: `1px solid ${c.border}`,
                    borderRadius: '12px', padding: '0.875rem',
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                  }}>
                    <div style={{
                      width: '32px', height: '32px', background: '#C9A96E15',
                      borderRadius: '8px', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700,
                      color: '#C9A96E', flexShrink: 0,
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
          </>
        )}
      </div>
    </>
  )
}