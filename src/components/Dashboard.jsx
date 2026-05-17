import { useEffect, useState, useMemo } from 'react'
import useStore from '../store/useStore'
import { getRepos, scanAllRepos } from '../services/github'
import RepoCard from './RepoCard'
import RepoDetail from './RepoDetail'
import FixModal from './FixModal'
import BulkFixModal from './BulkFixModal'
import MigrateModal from './MigrateModal'
import { SEV_CONFIG } from './RepoCard'
import { toast } from './Toast'

const LANGUAGES = ['Todos', 'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Ruby', 'PHP', 'C#', 'Rust']
const NPM_LANGS = new Set(['JavaScript', 'TypeScript'])

function SkeletonCard() {
  return (
    <div className="glass rounded-[1.5rem] p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="skeleton w-10 h-10 rounded-xl" />
          <div className="space-y-2">
            <div className="skeleton h-4 w-32 rounded" />
            <div className="skeleton h-3 w-20 rounded" />
          </div>
        </div>
        <div className="skeleton h-8 w-10 rounded" />
      </div>
      <div className="flex gap-2">
        <div className="skeleton h-6 w-16 rounded-full" />
        <div className="skeleton h-6 w-14 rounded-full" />
      </div>
      <div className="flex gap-2">
        <div className="skeleton h-9 flex-1 rounded-xl" />
        <div className="skeleton h-9 flex-1 rounded-xl" />
      </div>
    </div>
  )
}

function SummaryCard({ icon, value, label, color, bg }) {
  return (
    <div className="glass rounded-[1.5rem] p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
        <span className="material-symbols-outlined text-2xl" style={{ color }}>{icon}</span>
      </div>
      <div>
        <div className="text-3xl font-black" style={{ color, fontFamily: 'Space Grotesk' }}>{value}</div>
        <div className="text-xs text-[#908fa0] uppercase tracking-widest">{label}</div>
      </div>
    </div>
  )
}

// ── Migrate tab repo card ───────────────────────────────────────────────────
function MigrateRepoCard({ repo, onMigrate, migrated }) {
  return (
    <div
      className="glass rounded-[1.5rem] p-5 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5"
      style={{ borderColor: migrated ? 'rgba(221,183,255,0.3)' : 'rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: migrated ? 'rgba(221,183,255,0.15)' : 'rgba(255,255,255,0.05)' }}
        >
          <span
            className="material-symbols-outlined text-xl"
            style={{ color: migrated ? '#ddb7ff' : '#908fa0' }}
          >
            {migrated ? 'check_circle' : 'folder'}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[#e4e1ed] text-sm truncate">{repo.name}</span>
            {repo.private && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-widest"
                style={{ background: 'rgba(144,143,160,0.15)', color: '#908fa0' }}>
                privado
              </span>
            )}
          </div>
          <span className="text-xs text-[#908fa0]">{repo.language}</span>
        </div>
        {migrated && (
          <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: 'rgba(221,183,255,0.15)', color: '#ddb7ff' }}>
            lanzado
          </span>
        )}
      </div>

      <button
        onClick={() => onMigrate(repo)}
        disabled={migrated}
        className="w-full py-2 rounded-xl text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
        style={{
          background: migrated
            ? 'rgba(221,183,255,0.08)'
            : 'linear-gradient(135deg, rgba(221,183,255,0.2), rgba(168,85,247,0.15))',
          border: '1px solid rgba(221,183,255,0.3)',
          color: '#ddb7ff',
        }}
      >
        <span className="flex items-center justify-center gap-1.5">
          <span className="material-symbols-outlined text-sm">package_2</span>
          {migrated ? 'Workflow lanzado' : 'Migrar a pnpm'}
        </span>
      </button>
    </div>
  )
}

// ── Migrate tab ─────────────────────────────────────────────────────────────
function MigrateTab({ onMigrate }) {
  const token = useStore(s => s.token)
  const migrateHistory = useStore(s => s.migrateHistory)
  const migratedRepos = useMemo(
    () => new Set(migrateHistory.map(e => e.repo)),
    [migrateHistory]
  )

  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')

  async function loadRepos() {
    setLoading(true)
    setError('')
    try {
      const all = await getRepos(token)
      setRepos(all)
      setLoaded(true)
    } catch (err) {
      setError(err.message || 'Error al cargar repositorios')
    } finally {
      setLoading(false)
    }
  }

  const npmRepos = useMemo(
    () => repos.filter(r => NPM_LANGS.has(r.language)),
    [repos]
  )

  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 px-5 py-4 rounded-[1rem] text-sm"
        style={{ background: 'rgba(242,139,130,0.1)', border: '1px solid rgba(242,139,130,0.3)', color: '#f28b82' }}>
        <span className="material-symbols-outlined">error</span>
        {error}
      </div>
    )
  }

  if (!loaded) {
    return (
      <div className="text-center py-16">
        <span className="material-symbols-outlined text-[#464554] text-6xl block mb-4">package_2</span>
        <p className="text-[#908fa0] mb-4">Carga tus repos para ver cuáles puedes migrar a pnpm</p>
        <button
          onClick={loadRepos}
          className="flex items-center gap-2 px-5 py-2.5 rounded-[0.75rem] font-semibold text-sm mx-auto transition-all duration-200 hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #ddb7ff, #a855f7)', color: '#2d0066' }}
        >
          <span className="material-symbols-outlined text-xl">download</span>
          Cargar repositorios
        </button>
      </div>
    )
  }

  if (npmRepos.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="material-symbols-outlined text-[#464554] text-6xl block mb-4">package_2</span>
        <p className="text-[#908fa0]">No se encontraron repos JavaScript/TypeScript</p>
      </div>
    )
  }

  if (npmRepos.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="material-symbols-outlined text-[#464554] text-6xl block mb-4">package_2</span>
        <p className="text-[#908fa0]">No se encontraron repos JavaScript/TypeScript</p>
      </div>
    )
  }

  return (
    <>
      {/* Info banner */}
      <div
        className="flex items-start gap-3 px-5 py-4 rounded-[1rem] mb-6 text-sm"
        style={{ background: 'rgba(221,183,255,0.06)', border: '1px solid rgba(221,183,255,0.2)', color: '#c7c4d7' }}
      >
        <span className="material-symbols-outlined text-[#ddb7ff] flex-shrink-0 mt-0.5">info</span>
        <div>
          <strong className="text-[#ddb7ff]">¿Por qué pnpm?</strong>
          {' '}Hasta 3× más rápido que npm, ahorra espacio con un store compartido, y es compatible con cualquier proyecto Node.js.
          Cada repo generará un PR que debes revisar antes de mergear.
          <span className="block mt-1 text-[#464554]">
            Mostrando {npmRepos.length} repositorios JavaScript/TypeScript detectados.
          </span>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {npmRepos.map(repo => (
          <MigrateRepoCard
            key={repo.name}
            repo={repo}
            onMigrate={onMigrate}
            migrated={migratedRepos.has(repo.name)}
          />
        ))}
      </div>
    </>
  )
}

// ── Main Dashboard ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const token = useStore(s => s.token)
  const user = useStore(s => s.user)
  const scanResults = useStore(s => s.scanResults)
  const setScanResults = useStore(s => s.setScanResults)
  const scanning = useStore(s => s.scanning)
  const setScanning = useStore(s => s.setScanning)
  const scanProgress = useStore(s => s.scanProgress)
  const setScanProgress = useStore(s => s.setScanProgress)
  const filterSeverity = useStore(s => s.filterSeverity)
  const setFilterSeverity = useStore(s => s.setFilterSeverity)
  const filterLanguage = useStore(s => s.filterLanguage)
  const setFilterLanguage = useStore(s => s.setFilterLanguage)
  const filterFixable = useStore(s => s.filterFixable)
  const setFilterFixable = useStore(s => s.setFilterFixable)
  const selectedRepo = useStore(s => s.selectedRepo)
  const setAllRepos = useStore(s => s.setAllRepos)

  const [activeTab, setActiveTab] = useState('security') // 'security' | 'migrate'
  const [fixRepo, setFixRepo] = useState(null)
  const [bulkFixRepos, setBulkFixRepos] = useState(null)
  const [migrateRepo, setMigrateRepo] = useState(null)
  const [scanError, setScanError] = useState('')
  const [selected, setSelected] = useState(new Set())

  // No auto-scan — user chooses when to start

  function toggleSelect(repoName) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(repoName) ? next.delete(repoName) : next.add(repoName)
      return next
    })
  }

  function selectAll() { setSelected(new Set(filtered.map(r => r.name))) }
  function clearSelection() { setSelected(new Set()) }

  async function runScan() {
    setScanning(true)
    setScanError('')
    setScanResults(null)
    setSelected(new Set())
    try {
      const repos = await getRepos(token)
      setAllRepos(repos)
      setScanProgress({ current: 0, total: repos.length })
      const results = await scanAllRepos(token, user.login, repos, (current, total) => {
        setScanProgress({ current, total })
      })
      setScanResults(results)
      if (results.length > 0) {
        toast(`Escaneo completado: ${results.length} repos vulnerables`, 'info')
      } else {
        toast('¡Todo limpio! Sin vulnerabilidades detectadas', 'success')
      }
    } catch (err) {
      setScanError(err.message || 'Error al escanear repositorios.')
      toast('Error al escanear repositorios', 'error')
    } finally {
      setScanning(false)
    }
  }

  const stats = useMemo(() => {
    if (!scanResults) return null
    const total = scanResults.reduce((s, r) => s + r.count, 0)
    const counts = { critical: 0, high: 0, medium: 0, low: 0 }
    for (const r of scanResults) {
      for (const a of r.alerts) {
        if (counts[a.maxSeverity] !== undefined) counts[a.maxSeverity] += a.alerts
      }
    }
    return { total, ...counts, repos: scanResults.length }
  }, [scanResults])

  const filtered = useMemo(() => {
    if (!scanResults) return []
    return scanResults.filter(r => {
      if (filterSeverity !== 'all' && !r.alerts.some(a => a.maxSeverity === filterSeverity)) return false
      if (filterLanguage !== 'all' && filterLanguage !== 'Todos' && r.language !== filterLanguage) return false
      if (filterFixable && !r.alerts.some(a => a.hasfix)) return false
      return true
    })
  }, [scanResults, filterSeverity, filterLanguage, filterFixable])

  const progressPct = scanProgress.total > 0
    ? Math.round((scanProgress.current / scanProgress.total) * 100)
    : 0

  const TABS = [
    { id: 'security', label: 'Seguridad', icon: 'shield' },
    { id: 'migrate', label: 'Migrar a pnpm', icon: 'package_2' },
  ]

  return (
    <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#e4e1ed]">
            Hola, <span className="accent-text">{user?.login}</span>
          </h1>
          <p className="text-sm text-[#908fa0]">
            {scanning
              ? `Escaneando repos... ${scanProgress.current}/${scanProgress.total}`
              : scanResults
              ? `${scanResults.length} repos vulnerables encontrados`
              : 'Listo para escanear'
            }
          </p>
        </div>
        <button
          onClick={runScan}
          disabled={scanning}
          className="flex items-center gap-2 px-5 py-2.5 rounded-[0.75rem] font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          style={{
            background: scanning ? 'rgba(192,193,255,0.1)' : 'linear-gradient(135deg, #c0c1ff, #8083ff)',
            color: scanning ? '#c0c1ff' : '#1000a9',
            border: scanning ? '1px solid rgba(192,193,255,0.3)' : 'none',
          }}
        >
          <span className={`material-symbols-outlined text-xl ${scanning ? 'animate-spin' : ''}`}>
            {scanning ? 'sync' : 'search'}
          </span>
          {scanning ? 'Escaneando...' : 'Nuevo escaneo'}
        </button>
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: 'rgba(0,0,0,0.3)', width: 'fit-content' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
            style={activeTab === tab.id
              ? { background: 'rgba(192,193,255,0.15)', color: tab.id === 'migrate' ? '#ddb7ff' : '#c0c1ff', border: `1px solid ${tab.id === 'migrate' ? 'rgba(221,183,255,0.3)' : 'rgba(192,193,255,0.3)'}` }
              : { background: 'transparent', color: '#908fa0', border: '1px solid transparent' }
            }
          >
            <span className="material-symbols-outlined text-sm">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── SCAN PROGRESS ── */}
      {scanning && (
        <div className="glass rounded-[1.5rem] p-6 mb-8">
          <div className="flex items-center justify-between mb-3 text-sm">
            <span className="text-[#c7c4d7]">Analizando alertas de Dependabot...</span>
            <span className="text-[#c0c1ff] font-semibold">{progressPct}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #c0c1ff, #8083ff)' }}
            />
          </div>
          <p className="text-xs text-[#464554] mt-2">{scanProgress.current} de {scanProgress.total} repos revisados</p>
        </div>
      )}

      {/* ── ERROR ── */}
      {scanError && (
        <div
          className="flex items-center gap-3 px-5 py-4 rounded-[1rem] mb-8 text-sm"
          style={{ background: 'rgba(242,139,130,0.1)', border: '1px solid rgba(242,139,130,0.3)', color: '#f28b82' }}
        >
          <span className="material-symbols-outlined">error</span>
          {scanError}
        </div>
      )}

      {/* ── SKELETON ── */}
      {scanning && !scanResults && activeTab === 'security' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* ── SECURITY EMPTY STATE ── */}
      {activeTab === 'security' && !scanResults && !scanning && !scanError && (
        <div className="text-center py-20">
          <div
            className="w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(192,193,255,0.08)', border: '1px solid rgba(192,193,255,0.15)' }}
          >
            <span className="material-symbols-outlined text-[#c0c1ff] text-5xl">shield</span>
          </div>
          <h2 className="text-xl font-bold text-[#e4e1ed] mb-2">Escanea tus repositorios</h2>
          <p className="text-sm text-[#908fa0] mb-8 max-w-sm mx-auto">
            Analiza todas tus repos en busca de vulnerabilidades Dependabot y corrígelas con un clic.
          </p>
          <button
            onClick={runScan}
            className="flex items-center gap-2 px-6 py-3 rounded-[0.75rem] font-bold text-sm mx-auto transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #c0c1ff, #8083ff)', color: '#1000a9' }}
          >
            <span className="material-symbols-outlined text-xl">search</span>
            Iniciar escaneo
          </button>
        </div>
      )}

      {/* ── SECURITY TAB ── */}
      {activeTab === 'security' && scanResults && !scanning && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <SummaryCard icon="warning" value={stats.repos} label="Repos vulnerables" color="#c0c1ff" bg="rgba(192,193,255,0.1)" />
            <SummaryCard icon="report" value={stats.critical} label="Críticas" color={SEV_CONFIG.critical.color} bg={SEV_CONFIG.critical.bg} />
            <SummaryCard icon="priority_high" value={stats.high} label="Altas" color={SEV_CONFIG.high.color} bg={SEV_CONFIG.high.bg} />
            <SummaryCard icon="info" value={stats.medium + stats.low} label="Medias/Bajas" color={SEV_CONFIG.medium.color} bg={SEV_CONFIG.medium.bg} />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="flex items-center gap-1.5 no-scrollbar overflow-x-auto pb-1">
              {['all', 'critical', 'high', 'medium', 'low'].map(sev => {
                const active = filterSeverity === sev
                const cfg = sev !== 'all' ? SEV_CONFIG[sev] : null
                return (
                  <button key={sev} onClick={() => setFilterSeverity(sev)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap flex-shrink-0"
                    style={active ? {
                      background: cfg ? cfg.bg : 'rgba(192,193,255,0.15)',
                      color: cfg ? cfg.color : '#c0c1ff',
                      border: `1px solid ${cfg ? cfg.color : '#c0c1ff'}50`,
                    } : { background: 'transparent', color: '#908fa0', border: '1px solid rgba(144,143,160,0.2)' }}
                  >
                    {sev === 'all' ? 'Todas' : (SEV_CONFIG[sev]?.label || sev)}
                  </button>
                )
              })}
            </div>
            <select value={filterLanguage} onChange={e => setFilterLanguage(e.target.value)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold outline-none cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#908fa0' }}>
              {LANGUAGES.map(l => <option key={l} value={l === 'Todos' ? 'all' : l}>{l}</option>)}
            </select>
            <button onClick={() => setFilterFixable(!filterFixable)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap"
              style={filterFixable ? { background: 'rgba(129,201,149,0.15)', color: '#81c995', border: '1px solid rgba(129,201,149,0.4)' }
                : { background: 'transparent', color: '#908fa0', border: '1px solid rgba(144,143,160,0.2)' }}>
              <span className="material-symbols-outlined text-xs">auto_fix_high</span>
              Solo con fix
            </button>
            <span className="ml-auto text-xs text-[#464554]">{filtered.length} repos</span>
          </div>

          {/* Selection bar */}
          {filtered.length > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <button onClick={selected.size === filtered.length ? clearSelection : selectAll}
                className="flex items-center gap-1.5 text-xs text-[#908fa0] hover:text-[#c0c1ff] transition-colors">
                <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                  style={{ border: '1.5px solid', borderColor: selected.size === filtered.length ? '#c0c1ff' : 'rgba(144,143,160,0.5)', background: selected.size === filtered.length ? '#c0c1ff' : 'transparent' }}>
                  {selected.size === filtered.length && <span className="material-symbols-outlined text-[#1000a9]" style={{ fontSize: 11 }}>check</span>}
                  {selected.size > 0 && selected.size < filtered.length && <span style={{ width: 8, height: 2, background: '#908fa0', display: 'block', borderRadius: 1 }} />}
                </div>
                {selected.size === filtered.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
              </button>

              {selected.size > 0 && (
                <>
                  <span className="text-xs text-[#c0c1ff]">{selected.size} seleccionado{selected.size !== 1 ? 's' : ''}</span>
                  <button
                    onClick={() => setBulkFixRepos(filtered.filter(r => selected.has(r.name)))}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 ml-auto"
                    style={{ background: 'linear-gradient(135deg, #c0c1ff, #8083ff)', color: '#1000a9' }}>
                    <span className="material-symbols-outlined text-sm">auto_fix_high</span>
                    Fix {selected.size} repos
                  </button>
                  <button onClick={clearSelection} className="text-xs text-[#464554] hover:text-[#908fa0]">
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* Repo grid */}
          {filtered.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(repo => (
                <div key={repo.name} className="relative group">
                  <button
                    onClick={() => toggleSelect(repo.name)}
                    className="absolute top-3 right-3 z-10 w-5 h-5 rounded flex items-center justify-center transition-all duration-150"
                    style={{
                      border: '1.5px solid',
                      borderColor: selected.has(repo.name) ? '#c0c1ff' : 'rgba(144,143,160,0.4)',
                      background: selected.has(repo.name) ? '#c0c1ff' : 'rgba(11,14,20,0.7)',
                      opacity: selected.has(repo.name) ? 1 : 0,
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => { if (!selected.has(repo.name)) e.currentTarget.style.opacity = 0 }}
                  >
                    {selected.has(repo.name) && (
                      <span className="material-symbols-outlined text-[#1000a9]" style={{ fontSize: 12 }}>check</span>
                    )}
                  </button>
                  <div
                    className="cursor-pointer"
                    style={selected.has(repo.name) ? { outline: '2px solid rgba(192,193,255,0.5)', borderRadius: '1.5rem' } : {}}
                    onClick={() => toggleSelect(repo.name)}
                  >
                    <RepoCard repo={repo} onFix={(r) => { setFixRepo(r) }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-[#464554] text-6xl block mb-4">search_off</span>
              <p className="text-[#908fa0]">Sin repos que coincidan con los filtros</p>
              <button
                onClick={() => { setFilterSeverity('all'); setFilterLanguage('all'); setFilterFixable(false) }}
                className="mt-4 text-sm text-[#c0c1ff] hover:underline"
              >
                Limpiar filtros
              </button>
            </div>
          )}

          {scanResults.length === 0 && (
            <div className="text-center py-16">
              <span className="material-symbols-outlined filled text-[#81c995] text-6xl block mb-4">verified_user</span>
              <h3 className="text-xl font-bold text-[#e4e1ed] mb-2">¡Todo limpio!</h3>
              <p className="text-[#908fa0]">No se encontraron vulnerabilidades en tus repositorios</p>
            </div>
          )}
        </>
      )}

      {/* ── MIGRATE TAB ── */}
      {activeTab === 'migrate' && (
        <MigrateTab onMigrate={setMigrateRepo} />
      )}

      {/* ── MODALS ── */}
      {selectedRepo && <RepoDetail onFix={setFixRepo} />}
      {fixRepo && <FixModal repo={fixRepo} onClose={() => setFixRepo(null)} />}
      {bulkFixRepos && <BulkFixModal repos={bulkFixRepos} onClose={() => { setBulkFixRepos(null); clearSelection() }} />}
      {migrateRepo && (
        <MigrateModal
          repo={migrateRepo}
          onClose={() => setMigrateRepo(null)}
        />
      )}
    </main>
  )
}
