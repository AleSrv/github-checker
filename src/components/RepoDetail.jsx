import { useState } from 'react'
import useStore from '../store/useStore'
import { SEV_CONFIG } from './RepoCard'

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(() => {})
}

function PackageRow({ pkg }) {
  const cfg = SEV_CONFIG[pkg.maxSeverity] || SEV_CONFIG.unknown
  const [copied, setCopied] = useState(false)

  const installCmd = pkg.fixes.length > 0
    ? `npm install ${pkg.package}@${pkg.fixes[0]}`
    : null

  function handleCopy() {
    if (!installCmd) return
    copyToClipboard(installCmd)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${cfg.color}20` }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span
            className="px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            {(SEV_CONFIG[pkg.maxSeverity] || SEV_CONFIG.unknown).label.toUpperCase()}
          </span>
          <span className="font-mono text-sm font-semibold text-[#e4e1ed]">{pkg.package}</span>
          {pkg.ecosystem && (
            <span className="text-xs text-[#464554]">{pkg.ecosystem}</span>
          )}
        </div>
        <span className="text-xs text-[#908fa0] flex-shrink-0">{pkg.alerts} alerta{pkg.alerts !== 1 ? 's' : ''}</span>
      </div>

      {pkg.summaries.slice(0, 1).map((s, i) => (
        <p key={i} className="text-xs text-[#908fa0] mb-2 leading-relaxed">{s}</p>
      ))}

      <div className="flex items-center gap-3 flex-wrap">
        {pkg.cves.length > 0 && pkg.cves.map(cve => (
          <a
            key={cve}
            href={`https://nvd.nist.gov/vuln/detail/${cve}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity"
            style={{ background: 'rgba(192,193,255,0.1)', color: '#c0c1ff' }}
          >
            {cve}
          </a>
        ))}
        {pkg.ghsas.length > 0 && pkg.ghsas.map(ghsa => (
          <a
            key={ghsa}
            href={`https://github.com/advisories/${ghsa}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity"
            style={{ background: 'rgba(221,183,255,0.1)', color: '#ddb7ff' }}
          >
            {ghsa}
          </a>
        ))}
      </div>

      {pkg.vulnerable_range && (
        <p className="text-xs text-[#464554] mt-1.5">Rango vulnerable: <span className="font-mono text-[#908fa0]">{pkg.vulnerable_range}</span></p>
      )}

      {installCmd ? (
        <div
          className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(129,201,149,0.08)', border: '1px solid rgba(129,201,149,0.2)' }}
        >
          <span className="material-symbols-outlined text-[#81c995] text-sm">auto_fix_high</span>
          <code className="text-xs text-[#81c995] flex-1 font-mono truncate">{installCmd}</code>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-[#81c995] hover:text-white transition-colors flex-shrink-0"
          >
            <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'content_copy'}</span>
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      ) : (
        <div
          className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(253,214,99,0.08)', border: '1px solid rgba(253,214,99,0.2)' }}
        >
          <span className="material-symbols-outlined text-[#fdd663] text-sm">warning</span>
          <span className="text-xs text-[#fdd663]">Sin parche disponible todavía</span>
        </div>
      )}
    </div>
  )
}

export default function RepoDetail({ onFix }) {
  const selectedRepo = useStore(s => s.selectedRepo)
  const setSelectedRepo = useStore(s => s.setSelectedRepo)

  if (!selectedRepo) return null

  const bySev = {
    critical: selectedRepo.alerts.filter(a => a.maxSeverity === 'critical'),
    high:     selectedRepo.alerts.filter(a => a.maxSeverity === 'high'),
    medium:   selectedRepo.alerts.filter(a => a.maxSeverity === 'medium'),
    low:      selectedRepo.alerts.filter(a => a.maxSeverity === 'low'),
    unknown:  selectedRepo.alerts.filter(a => a.maxSeverity === 'unknown'),
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={() => setSelectedRepo(null)}
    >
      <div
        className="glass rounded-[1.5rem] w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/8">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(192,193,255,0.1)' }}
            >
              <span className="material-symbols-outlined text-[#c0c1ff]">folder</span>
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-[#e4e1ed] truncate">{selectedRepo.name}</h2>
              <p className="text-xs text-[#908fa0]">
                {selectedRepo.count} vulnerabilidad{selectedRepo.count !== 1 ? 'es' : ''} · {selectedRepo.alerts.length} paquete{selectedRepo.alerts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={selectedRepo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              title="Abrir en GitHub"
            >
              <span className="material-symbols-outlined text-[#908fa0] text-xl">open_in_new</span>
            </a>
            <button
              onClick={() => setSelectedRepo(null)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-[#908fa0]">close</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {['critical', 'high', 'medium', 'low', 'unknown'].map(sev => {
            const pkgs = bySev[sev]
            if (!pkgs.length) return null
            const cfg = SEV_CONFIG[sev]
            return (
              <div key={sev}>
                <h3
                  className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2"
                  style={{ color: cfg.color }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                  {cfg.label} — {pkgs.length} paquete{pkgs.length !== 1 ? 's' : ''}
                </h3>
                <div className="space-y-3">
                  {pkgs.map(pkg => <PackageRow key={pkg.package} pkg={pkg} />)}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/8">
          <button
            onClick={() => { setSelectedRepo(null); onFix(selectedRepo) }}
            className="w-full py-3 rounded-[0.75rem] font-bold text-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #c0c1ff 0%, #8083ff 100%)',
              color: '#1000a9',
              boxShadow: '0 4px 24px rgba(192,193,255,0.2)',
            }}
          >
            <span className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-xl">build_circle</span>
              Corregir este repositorio
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
