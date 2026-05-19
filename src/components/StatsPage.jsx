import { useMemo, useState } from 'react'
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

const NPM_LANGS = new Set(['JavaScript', 'TypeScript'])

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

function HistoryEntry({ entry, type }) {
  const date = new Date(entry.timestamp)
  const formatted = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const isMigrate = type === 'migrate'

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: isMigrate ? 'rgba(221,183,255,0.15)' : 'rgba(129,201,149,0.15)' }}>
          <span className="material-symbols-outlined text-sm" style={{ color: isMigrate ? '#ddb7ff' : '#81c995' }}>
            {isMigrate ? 'package_2' : 'build_circle'}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#e4e1ed] truncate">{entry.repo}</p>
          <p className="text-xs text-[#464554]">{formatted}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {!isMigrate && entry.vulns !== undefined && (
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(255,183,131,0.15)', color: '#ffb783' }}>
            {entry.vulns} vulns
          </span>
        )}
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

// ── Security stats ───────────────────────────────────────────────────────────
function SecurityStats({ scanResults, fixHistory }) {
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

  if (!scanResults) {
    return (
      <div className="text-center py-20">
        <span className="material-symbols-outlined text-[#464554] text-6xl block mb-4">bar_chart</span>
        <p className="text-[#908fa0] mb-4">Primero ejecuta un escaneo desde el Dashboard</p>
        <a href="/dashboard" className="text-sm text-[#c0c1ff] hover:underline">Ir al Dashboard →</a>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-20">
        <span className="material-symbols-outlined text-[#81c995] text-6xl block mb-4">verified</span>
        <p className="text-[#908fa0]">¡No se encontraron vulnerabilidades!</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Summary pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(stats.severityCounts).map(([sev, count]) => {
          const cfg = SEV_CONFIG[sev]
          return (
            <div key={sev} className="glass rounded-[1.5rem] text-center" style={{ padding: '1.25rem' }}>
              <div className="text-4xl font-black" style={{ color: cfg.color, fontFamily: 'Space Grotesk', marginBottom: '0.25rem' }}>
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
        <div className="glass rounded-[1.5rem]" style={{ padding: '1.5rem' }}>
          <h2 className="text-xs font-semibold text-[#908fa0] uppercase tracking-widest" style={{ marginBottom: '0.25rem' }}>
            Distribución por severidad
          </h2>
          <p className="text-[#464554] text-xs" style={{ marginBottom: '1rem' }}>{stats.total} vulnerabilidades totales</p>
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

        <div className="glass rounded-[1.5rem]" style={{ padding: '1.5rem' }}>
          <h2 className="text-xs font-semibold text-[#908fa0] uppercase tracking-widest" style={{ marginBottom: '0.25rem' }}>
            Repos más vulnerables
          </h2>
          <p className="text-[#464554] text-xs" style={{ marginBottom: '1rem' }}>{stats.topRepos.length} repos con alertas abiertas</p>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.topRepos}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
              >
                <XAxis type="number" tick={{ fill: '#908fa0', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={115} tick={{ fill: '#c7c4d7', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="Vulnerabilidades" radius={[0, 6, 6, 0]} maxBarSize={16}>
                  {stats.topRepos.map((entry, i) => (
                    <Cell key={i} fill={`rgba(192,193,255,${Math.max(0.4, 1 - i * 0.07)})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top packages table */}
      <div className="glass rounded-[1.5rem]" style={{ padding: '1.5rem' }}>
        <h2 className="text-xs font-semibold text-[#908fa0] uppercase tracking-widest flex items-center gap-2" style={{ marginBottom: '1.5rem' }}>
          <span className="material-symbols-outlined filled text-[#ffb783] text-base">workspace_premium</span>
          Top 10 paquetes más problemáticos
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <th style={{ paddingBottom: '0.75rem', paddingRight: '0.75rem', width: '1.5rem' }} className="text-[#464554] text-xs uppercase tracking-wide font-medium">#</th>
                <th style={{ paddingBottom: '0.75rem', paddingRight: '0.75rem' }} className="text-[#464554] text-xs uppercase tracking-wide font-medium">Paquete</th>
                <th style={{ paddingBottom: '0.75rem', paddingRight: '0.75rem' }} className="text-[#464554] text-xs uppercase tracking-wide font-medium">Repos</th>
                <th style={{ paddingBottom: '0.75rem', paddingRight: '0.75rem' }} className="text-[#464554] text-xs uppercase tracking-wide font-medium">Alertas</th>
                <th style={{ paddingBottom: '0.75rem' }} className="text-[#464554] text-xs uppercase tracking-wide font-medium">Severidad</th>
              </tr>
            </thead>
            <tbody>
              {stats.topPackages.map((pkg, i) => {
                const cfg = SEV_CONFIG[pkg.severity] || SEV_CONFIG.unknown
                const barWidth = Math.max(8, (pkg.repos / stats.topPackages[0].repos) * 80)
                return (
                  <tr key={pkg.package} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '0.75rem 0.75rem 0.75rem 0' }} className="text-[#464554] text-xs font-mono">{i + 1}</td>
                    <td style={{ padding: '0.75rem 0.75rem 0.75rem 0' }}>
                      <span className="font-mono text-[#e4e1ed] text-sm">{pkg.package}</span>
                    </td>
                    <td style={{ padding: '0.75rem 0.75rem 0.75rem 0' }}>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 rounded-full" style={{ width: barWidth, background: 'rgba(192,193,255,0.5)' }} />
                        <span className="text-[#c7c4d7] text-xs">{pkg.repos}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 0.75rem 0.75rem 0' }} className="text-[#c7c4d7] text-xs">{pkg.alerts}</td>
                    <td style={{ padding: '0.75rem 0' }}>
                      <span className="text-xs font-semibold"
                        style={{ padding: '0.125rem 0.5rem', borderRadius: '9999px', background: cfg.bg, color: cfg.color }}>
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
      <div className="glass rounded-[1.5rem]" style={{ padding: '1.5rem' }}>
        <h2 className="text-xs font-semibold text-[#908fa0] uppercase tracking-widest flex items-center gap-2" style={{ marginBottom: '1rem' }}>
          <span className="material-symbols-outlined text-[#c0c1ff] text-base">history</span>
          Historial de correcciones de seguridad
        </h2>
        {fixHistory.length === 0 ? (
          <div className="text-center py-8">
            <span className="material-symbols-outlined text-[#464554] text-4xl block mb-2">history</span>
            <p className="text-sm text-[#464554]">Aún no has lanzado ninguna corrección</p>
          </div>
        ) : (
          <div>{fixHistory.map((entry, i) => <HistoryEntry key={i} entry={entry} type="fix" />)}</div>
        )}
      </div>
    </div>
  )
}

// ── pnpm migration stats ─────────────────────────────────────────────────────
function MigrateStats({ allRepos, allReposLoaded, migrateHistory }) {
  const npmRepos = useMemo(
    () => allRepos.filter(r => NPM_LANGS.has(r.language)),
    [allRepos]
  )

  const migratedSet = useMemo(
    () => new Set(migrateHistory.map(e => e.repo)),
    [migrateHistory]
  )

  const pending = npmRepos.filter(r => !migratedSet.has(r.name)).length
  const migrated = migrateHistory.length

  const topReposData = useMemo(() => {
    if (npmRepos.length === 0) return []
    const byLang = {}
    for (const r of npmRepos) {
      byLang[r.language] = (byLang[r.language] || 0) + 1
    }
    return Object.entries(byLang).map(([name, count]) => ({ name, Repos: count }))
      .sort((a, b) => b.Repos - a.Repos)
  }, [npmRepos])

  if (!allReposLoaded && migrateHistory.length === 0) {
    return (
      <div className="text-center py-20">
        <span className="material-symbols-outlined text-[#464554] text-6xl block mb-4">package_2</span>
        <p className="text-[#908fa0] mb-4">Carga los repositorios desde la pestaña "Migrar a pnpm" del Dashboard para ver estadísticas</p>
        <a href="/dashboard" className="text-sm text-[#ddb7ff] hover:underline">Ir al Dashboard →</a>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-[1.5rem] text-center" style={{ padding: '1.25rem' }}>
          <div className="text-4xl font-black" style={{ color: '#ddb7ff', fontFamily: 'Space Grotesk', marginBottom: '0.25rem' }}>
            {allReposLoaded ? npmRepos.length : '—'}
          </div>
          <div className="text-xs uppercase tracking-widest font-semibold text-[#ddb7ff]">Repos JS/TS</div>
        </div>
        <div className="glass rounded-[1.5rem] text-center" style={{ padding: '1.25rem' }}>
          <div className="text-4xl font-black" style={{ color: '#81c995', fontFamily: 'Space Grotesk', marginBottom: '0.25rem' }}>
            {migrated}
          </div>
          <div className="text-xs uppercase tracking-widest font-semibold text-[#81c995]">Migraciones lanzadas</div>
        </div>
        <div className="glass rounded-[1.5rem] text-center" style={{ padding: '1.25rem' }}>
          <div className="text-4xl font-black" style={{ color: '#fdd663', fontFamily: 'Space Grotesk', marginBottom: '0.25rem' }}>
            {allReposLoaded ? pending : '—'}
          </div>
          <div className="text-xs uppercase tracking-widest font-semibold text-[#fdd663]">Pendientes</div>
        </div>
      </div>

      {/* Language breakdown chart */}
      {allReposLoaded && topReposData.length > 0 && (
        <div className="glass rounded-[1.5rem]" style={{ padding: '1.5rem' }}>
          <h2 className="text-xs font-semibold text-[#908fa0] uppercase tracking-widest" style={{ marginBottom: '0.25rem' }}>
            Repos JS/TS por lenguaje
          </h2>
          <p className="text-[#464554] text-xs" style={{ marginBottom: '1rem' }}>{npmRepos.length} repos candidatos a migración</p>
          <div style={{ width: '100%', height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topReposData} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: '#c7c4d7', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#908fa0', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="Repos" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  <Cell fill="rgba(221,183,255,0.7)" />
                  <Cell fill="rgba(192,193,255,0.7)" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Migrate history */}
      <div className="glass rounded-[1.5rem]" style={{ padding: '1.5rem' }}>
        <h2 className="text-xs font-semibold text-[#908fa0] uppercase tracking-widest flex items-center gap-2" style={{ marginBottom: '1rem' }}>
          <span className="material-symbols-outlined text-[#ddb7ff] text-base">history</span>
          Historial de migraciones a pnpm
        </h2>
        {migrateHistory.length === 0 ? (
          <div className="text-center py-8">
            <span className="material-symbols-outlined text-[#464554] text-4xl block mb-2">package_2</span>
            <p className="text-sm text-[#464554]">Aún no has lanzado ninguna migración</p>
          </div>
        ) : (
          <div>{migrateHistory.map((entry, i) => <HistoryEntry key={i} entry={entry} type="migrate" />)}</div>
        )}
      </div>
    </div>
  )
}

// ── Main StatsPage ───────────────────────────────────────────────────────────
export default function StatsPage() {
  const scanResults = useStore(s => s.scanResults)
  const fixHistory = useStore(s => s.fixHistory)
  const allRepos = useStore(s => s.allRepos)
  const allReposLoaded = useStore(s => s.allReposLoaded)
  const migrateHistory = useStore(s => s.migrateHistory)

  const activeTab = useStore(s => s.activeTab)
  const [mode, setMode] = useState(activeTab)

  const TABS = [
    { id: 'security', label: 'Seguridad', icon: 'shield' },
    { id: 'migrate', label: 'Migración a pnpm', icon: 'package_2' },
  ]

  return (
    <main className="flex-1 w-full" style={{ maxWidth: '1400px', marginLeft: 'auto', marginRight: 'auto', padding: '2rem 1.5rem' }}>
      <div className="flex items-center justify-between flex-wrap gap-4" style={{ marginBottom: '2rem' }}>
        <h1 className="text-2xl font-bold text-[#e4e1ed]">Estadísticas</h1>

        {/* Mode toggle */}
        <div className="flex gap-1 rounded-xl" style={{ padding: '0.25rem', background: 'rgba(0,0,0,0.3)' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id)}
              className="flex items-center gap-2 rounded-lg text-sm font-semibold transition-all duration-200"
              style={mode === tab.id
                ? { padding: '0.5rem 1rem', background: 'rgba(192,193,255,0.15)', color: tab.id === 'migrate' ? '#ddb7ff' : '#c0c1ff', border: '1px solid rgba(192,193,255,0.3)' }
                : { padding: '0.5rem 1rem', background: 'transparent', color: '#908fa0', border: '1px solid transparent' }
              }
            >
              <span className="material-symbols-outlined text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {mode === 'security'
        ? <SecurityStats scanResults={scanResults} fixHistory={fixHistory} />
        : <MigrateStats allRepos={allRepos} allReposLoaded={allReposLoaded} migrateHistory={migrateHistory} />
      }
    </main>
  )
}
