import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import useStore from '../store/useStore'
import { SEV_CONFIG } from './RepoCard'

const SEV_COLORS = {
  critical: '#ffb783',
  high: '#f28b82',
  medium: '#fdd663',
  low: '#81c995',
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1f1f27', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.75rem', padding: '8px 12px' }}>
      <p style={{ color: '#e4e1ed', fontWeight: 600, marginBottom: 2, fontSize: 13 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.fill || p.color, fontSize: 12 }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  )
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div style={{ background: '#1f1f27', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.75rem', padding: '8px 12px' }}>
      <p style={{ color: p.payload.color, fontWeight: 600, fontSize: 13 }}>{p.name}</p>
      <p style={{ color: '#e4e1ed', fontSize: 12 }}>{p.value} vulnerabilidades</p>
      <p style={{ color: '#908fa0', fontSize: 11 }}>{p.payload.pct}% del total</p>
    </div>
  )
}

function HistoryEntry({ entry }) {
  const date = new Date(entry.timestamp)
  const formatted = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(129,201,149,0.15)' }}>
          <span className="material-symbols-outlined text-[#81c995] text-sm">build_circle</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#e4e1ed] truncate">{entry.repo}</p>
          <p className="text-xs text-[#464554]">{formatted}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-xs px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(255,183,131,0.15)', color: '#ffb783' }}>
          {entry.vulns} vulns
        </span>
        {entry.workflowUrl && (
          <a href={entry.workflowUrl} target="_blank" rel="noopener noreferrer"
            className="text-[#908fa0] hover:text-[#c0c1ff] transition-colors">
            <span className="material-symbols-outlined text-sm">open_in_new</span>
          </a>
        )}
      </div>
    </div>
  )
}

const RADIAN = Math.PI / 180
function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.05) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function StatsPage() {
  const scanResults = useStore(s => s.scanResults)
  const fixHistory = useStore(s => s.fixHistory)

  const stats = useMemo(() => {
    if (!scanResults || scanResults.length === 0) return null

    const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 }
    const packageMap = {}

    for (const repo of scanResults) {
      for (const pkg of repo.alerts) {
        if (severityCounts[pkg.maxSeverity] !== undefined) {
          severityCounts[pkg.maxSeverity] += pkg.alerts
        }
        if (!packageMap[pkg.package]) {
          packageMap[pkg.package] = { package: pkg.package, repos: 0, alerts: 0, severity: pkg.maxSeverity }
        }
        packageMap[pkg.package].repos++
        packageMap[pkg.package].alerts += pkg.alerts
      }
    }

    const total = Object.values(severityCounts).reduce((a, b) => a + b, 0)

    const severityData = Object.entries(severityCounts)
      .filter(([, v]) => v > 0)
      .map(([key, value]) => ({
        name: SEV_CONFIG[key]?.label || key,
        value,
        color: SEV_COLORS[key],
        pct: total > 0 ? ((value / total) * 100).toFixed(1) : '0',
      }))

    const topRepos = [...scanResults]
      .sort((a, b) => b.count - a.count)
      .slice(0, 12)
      .map(r => ({
        name: r.name.length > 22 ? r.name.slice(0, 20) + '…' : r.name,
        Vulnerabilidades: r.count,
      }))

    const topPackages = Object.values(packageMap)
      .sort((a, b) => b.repos - a.repos || b.alerts - a.alerts)
      .slice(0, 10)

    return { severityData, topRepos, topPackages, severityCounts, total }
  }, [scanResults])

  return (
    <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
      <h1 className="text-2xl font-bold text-[#e4e1ed] mb-8">Estadísticas</h1>

      {!scanResults && (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-[#464554] text-6xl block mb-4">bar_chart</span>
          <p className="text-[#908fa0] mb-4">Primero ejecuta un escaneo desde el Dashboard</p>
          <a href="/dashboard" className="text-sm text-[#c0c1ff] hover:underline">Ir al Dashboard →</a>
        </div>
      )}

      {stats && (
        <div className="space-y-8">

          {/* Summary pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(stats.severityCounts).map(([sev, count]) => {
              const cfg = SEV_CONFIG[sev]
              return (
                <div key={sev} className="glass rounded-[1.5rem] p-5 text-center">
                  <div className="text-4xl font-black mb-1" style={{ color: cfg.color, fontFamily: 'Space Grotesk' }}>
                    {count}
                  </div>
                  <div className="text-xs uppercase tracking-widest font-semibold" style={{ color: cfg.color }}>
                    {cfg.label}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Charts row */}
          <div className="grid lg:grid-cols-2 gap-6">

            {/* Donut chart */}
            <div className="glass rounded-[1.5rem] p-6">
              <h2 className="text-xs font-semibold text-[#908fa0] uppercase tracking-widest mb-1">
                Distribución por severidad
              </h2>
              <p className="text-[#464554] text-xs mb-4">{stats.total} vulnerabilidades totales</p>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.severityData}
                      cx="50%"
                      cy="45%"
                      innerRadius="38%"
                      outerRadius="62%"
                      paddingAngle={2}
                      dataKey="value"
                      labelLine={false}
                      label={renderCustomLabel}
                    >
                      {stats.severityData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value, entry) => (
                        <span style={{ color: '#c7c4d7', fontSize: 12 }}>
                          {value} <span style={{ color: entry.color, fontWeight: 700 }}>{entry.payload.value}</span>
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar chart */}
            <div className="glass rounded-[1.5rem] p-6">
              <h2 className="text-xs font-semibold text-[#908fa0] uppercase tracking-widest mb-1">
                Repos más vulnerables
              </h2>
              <p className="text-[#464554] text-xs mb-4">{stats.topRepos.length} repos con alertas abiertas</p>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.topRepos}
                    layout="vertical"
                    margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                  >
                    <XAxis
                      type="number"
                      tick={{ fill: '#908fa0', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={115}
                      tick={{ fill: '#c7c4d7', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                    <Bar dataKey="Vulnerabilidades" radius={[0, 6, 6, 0]} maxBarSize={16}>
                      {stats.topRepos.map((entry, i) => {
                        const opacity = Math.max(0.4, 1 - i * 0.07)
                        return <Cell key={i} fill={`rgba(192,193,255,${opacity})`} />
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top packages table */}
          <div className="glass rounded-[1.5rem] p-6">
            <h2 className="text-xs font-semibold text-[#908fa0] uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined filled text-[#ffb783] text-base">workspace_premium</span>
              Top 10 paquetes más problemáticos
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-white/8">
                    <th className="pb-3 pr-3 text-[#464554] text-xs uppercase tracking-wide font-medium w-6">#</th>
                    <th className="pb-3 pr-3 text-[#464554] text-xs uppercase tracking-wide font-medium">Paquete</th>
                    <th className="pb-3 pr-3 text-[#464554] text-xs uppercase tracking-wide font-medium">Repos</th>
                    <th className="pb-3 pr-3 text-[#464554] text-xs uppercase tracking-wide font-medium">Alertas</th>
                    <th className="pb-3 text-[#464554] text-xs uppercase tracking-wide font-medium">Severidad</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topPackages.map((pkg, i) => {
                    const cfg = SEV_CONFIG[pkg.severity] || SEV_CONFIG.unknown
                    const barWidth = Math.max(8, (pkg.repos / stats.topPackages[0].repos) * 80)
                    return (
                      <tr key={pkg.package} className="border-b border-white/4 last:border-0">
                        <td className="py-3 pr-3 text-[#464554] text-xs font-mono">{i + 1}</td>
                        <td className="py-3 pr-3">
                          <span className="font-mono text-[#e4e1ed] text-sm">{pkg.package}</span>
                        </td>
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 rounded-full" style={{ width: barWidth, background: 'rgba(192,193,255,0.5)' }} />
                            <span className="text-[#c7c4d7] text-xs">{pkg.repos}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-3 text-[#c7c4d7] text-xs">{pkg.alerts}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: cfg.bg, color: cfg.color }}>
                            {cfg.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fix history */}
          <div className="glass rounded-[1.5rem] p-6">
            <h2 className="text-xs font-semibold text-[#908fa0] uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#c0c1ff] text-base">history</span>
              Historial de correcciones
            </h2>
            {fixHistory.length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-[#464554] text-4xl block mb-2">history</span>
                <p className="text-sm text-[#464554]">Aún no has lanzado ninguna corrección</p>
              </div>
            ) : (
              <div>{fixHistory.map((entry, i) => <HistoryEntry key={i} entry={entry} />)}</div>
            )}
          </div>

        </div>
      )}
    </main>
  )
}
