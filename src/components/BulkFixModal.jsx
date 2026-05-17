import { useState } from 'react'
import useStore from '../store/useStore'
import { pushWorkflowAndFix } from '../services/github'
import { toast } from './Toast'
import { SEV_CONFIG } from './RepoCard'

export default function BulkFixModal({ repos, onClose }) {
  const token = useStore(s => s.token)
  const user = useStore(s => s.user)
  const addFixHistory = useStore(s => s.addFixHistory)

  const [accepted, setAccepted] = useState(false)
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState([]) // { repo, status, url }
  const [currentRepo, setCurrentRepo] = useState(null)
  const [done, setDone] = useState(false)

  const totalVulns = repos.reduce((s, r) => s + r.count, 0)

  async function handleBulkFix() {
    setRunning(true)
    const newResults = []

    for (const repo of repos) {
      setCurrentRepo(repo.name)
      try {
        const res = await pushWorkflowAndFix(token, user.login, repo.name)
        addFixHistory({
          repo: repo.name,
          timestamp: new Date().toISOString(),
          workflowUrl: res.workflowUrl,
          vulns: repo.count,
        })
        newResults.push({ repo: repo.name, status: 'ok', url: res.workflowUrl })
      } catch (err) {
        newResults.push({ repo: repo.name, status: 'error', error: err.message })
      }
      setResults([...newResults])
      // Small delay between repos
      await new Promise(r => setTimeout(r, 600))
    }

    setCurrentRepo(null)
    setRunning(false)
    setDone(true)

    const ok = newResults.filter(r => r.status === 'ok').length
    const fail = newResults.filter(r => r.status === 'error').length
    if (ok > 0) toast(`${ok} workflow${ok > 1 ? 's' : ''} lanzado${ok > 1 ? 's' : ''} correctamente`, 'success')
    if (fail > 0) toast(`${fail} repo${fail > 1 ? 's' : ''} fallaron`, 'error')
  }

  const progress = repos.length > 0 ? (results.length / repos.length) * 100 : 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={running ? undefined : onClose}
    >
      <div
        className="glass rounded-[1.5rem] w-full max-w-lg max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-white/8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(192,193,255,0.1)' }}>
            <span className="material-symbols-outlined filled text-[#c0c1ff] text-2xl">auto_fix_high</span>
          </div>
          <div>
            <h2 className="font-bold text-[#e4e1ed]">Fix masivo</h2>
            <p className="text-sm text-[#908fa0]">
              {repos.length} repos · {totalVulns} vulnerabilidades en total
            </p>
          </div>
          {!running && (
            <button onClick={onClose} className="ml-auto w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10">
              <span className="material-symbols-outlined text-[#908fa0]">close</span>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* Disclaimer (pre-run) */}
          {!running && !done && (
            <>
              <div className="rounded-xl p-4 mb-5 text-sm text-[#c7c4d7] leading-relaxed space-y-2"
                style={{ background: 'rgba(255,183,131,0.06)', border: '1px solid rgba(255,183,131,0.2)' }}>
                <p>Se lanzará un workflow de GitHub Actions en <strong className="text-[#e4e1ed]">cada uno de los {repos.length} repositorios</strong> seleccionados. Cada workflow:</p>
                <ul className="space-y-1 ml-2">
                  {['Ejecutará npm audit fix --force', 'Abrirá un PR en la rama security-fix-auto', 'No mergeará automáticamente — tú decides'].map(t => (
                    <li key={t} className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[#ffb783] text-sm mt-0.5">chevron_right</span>{t}
                    </li>
                  ))}
                </ul>
                <p className="font-semibold text-[#e4e1ed]">Revisa y mergea cada PR manualmente.</p>
              </div>

              {/* Repo list preview */}
              <div className="space-y-2 mb-5 max-h-48 overflow-y-auto">
                {repos.map(r => {
                  const maxSev = r.alerts.some(a => a.maxSeverity === 'critical') ? 'critical'
                    : r.alerts.some(a => a.maxSeverity === 'high') ? 'high'
                    : r.alerts.some(a => a.maxSeverity === 'medium') ? 'medium' : 'low'
                  const cfg = SEV_CONFIG[maxSev]
                  return (
                    <div key={r.name} className="flex items-center justify-between px-3 py-2 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="material-symbols-outlined text-[#464554] text-sm">folder</span>
                        <span className="text-sm text-[#c7c4d7] truncate">{r.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-bold" style={{ color: cfg.color }}>{r.count}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                          style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} className="sr-only" />
                  <div className="w-5 h-5 rounded-md flex items-center justify-center transition-all duration-200"
                    style={{ background: accepted ? '#c0c1ff' : 'transparent', border: accepted ? '2px solid #c0c1ff' : '2px solid rgba(144,143,160,0.5)' }}>
                    {accepted && <span className="material-symbols-outlined text-[#1000a9] text-sm">check</span>}
                  </div>
                </div>
                <span className="text-sm text-[#c7c4d7] leading-relaxed">
                  Entiendo que se crearán PRs en todos estos repos y soy responsable de revisarlos.
                </span>
              </label>
            </>
          )}

          {/* Progress (running) */}
          {(running || done) && (
            <div className="space-y-3">
              {/* Progress bar */}
              {running && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-[#908fa0] mb-2">
                    <span>Procesando <strong className="text-[#c0c1ff]">{currentRepo}</strong>…</span>
                    <span>{results.length}/{repos.length}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #c0c1ff, #8083ff)' }} />
                  </div>
                </div>
              )}

              {/* Done summary */}
              {done && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-3"
                  style={{ background: 'rgba(129,201,149,0.1)', border: '1px solid rgba(129,201,149,0.25)' }}>
                  <span className="material-symbols-outlined filled text-[#81c995]">check_circle</span>
                  <div>
                    <p className="text-sm font-bold text-[#81c995]">Fix masivo completado</p>
                    <p className="text-xs text-[#908fa0]">
                      {results.filter(r => r.status === 'ok').length} exitosos · {results.filter(r => r.status === 'error').length} fallidos
                    </p>
                  </div>
                </div>
              )}

              {/* Per-repo results */}
              {results.map(r => (
                <div key={r.repo} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl"
                  style={{ background: r.status === 'ok' ? 'rgba(129,201,149,0.06)' : 'rgba(242,139,130,0.06)', border: `1px solid ${r.status === 'ok' ? 'rgba(129,201,149,0.2)' : 'rgba(242,139,130,0.2)'}` }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`material-symbols-outlined filled text-sm ${r.status === 'ok' ? 'text-[#81c995]' : 'text-[#f28b82]'}`}>
                      {r.status === 'ok' ? 'check_circle' : 'error'}
                    </span>
                    <span className="text-sm text-[#c7c4d7] truncate">{r.repo}</span>
                  </div>
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-[#c0c1ff] hover:underline flex-shrink-0 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                      Actions
                    </a>
                  )}
                  {r.error && <span className="text-xs text-[#f28b82] truncate flex-shrink-0">{r.error}</span>}
                </div>
              ))}

              {/* Pending repos (still in queue) */}
              {running && repos.slice(results.length + 1).map(r => (
                <div key={r.name} className="flex items-center gap-2 px-3 py-2.5 rounded-xl opacity-30"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="material-symbols-outlined text-[#464554] text-sm">schedule</span>
                  <span className="text-sm text-[#464554] truncate">{r.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/8">
          {!running && !done && (
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 rounded-[0.75rem] font-semibold text-sm glass hover:bg-white/10 transition-all"
                style={{ color: '#908fa0' }}>
                Cancelar
              </button>
              <button
                onClick={handleBulkFix}
                disabled={!accepted}
                className="flex-1 py-3 rounded-[0.75rem] font-bold text-sm transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                style={{ background: 'linear-gradient(135deg, #c0c1ff, #8083ff)', color: '#1000a9', boxShadow: accepted ? '0 4px 24px rgba(192,193,255,0.2)' : 'none' }}>
                <span className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-xl">rocket_launch</span>
                  Lanzar {repos.length} fixes
                </span>
              </button>
            </div>
          )}
          {done && (
            <button onClick={onClose} className="w-full py-3 rounded-[0.75rem] font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #c0c1ff, #8083ff)', color: '#1000a9' }}>
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
