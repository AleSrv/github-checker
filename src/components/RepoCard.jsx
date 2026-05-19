import useStore from '../store/useStore'

const SEV_CONFIG = {
  critical: { color: '#ffb783', bg: 'rgba(255,183,131,0.15)', label: 'Crítica' },
  high:     { color: '#f28b82', bg: 'rgba(242,139,130,0.15)', label: 'Alta' },
  medium:   { color: '#fdd663', bg: 'rgba(253,214,99,0.15)',  label: 'Media' },
  low:      { color: '#81c995', bg: 'rgba(129,201,149,0.15)', label: 'Baja' },
  unknown:  { color: '#908fa0', bg: 'rgba(144,143,160,0.15)', label: 'Info' },
}

function getMaxSeverity(alerts) {
  for (const sev of ['critical', 'high', 'medium', 'low']) {
    if (alerts.some(a => a.maxSeverity === sev)) return sev
  }
  return 'unknown'
}

function SevBadge({ severity, count }) {
  const cfg = SEV_CONFIG[severity] || SEV_CONFIG.unknown
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full text-xs font-semibold"
      style={{ padding: '0.125rem 0.5rem', background: cfg.bg, color: cfg.color }}
    >
      {count && <span>{count}</span>}
      {cfg.label}
    </span>
  )
}

export { SevBadge, SEV_CONFIG }

export default function RepoCard({ repo, onFix }) {
  const setSelectedRepo = useStore(s => s.setSelectedRepo)
  const maxSev = getMaxSeverity(repo.alerts)
  const cfg = SEV_CONFIG[maxSev]
  const fixable = repo.alerts.some(a => a.hasfix)

  const critCount = repo.alerts.filter(a => a.maxSeverity === 'critical').length
  const highCount = repo.alerts.filter(a => a.maxSeverity === 'high').length
  const medCount  = repo.alerts.filter(a => a.maxSeverity === 'medium').length
  const lowCount  = repo.alerts.filter(a => a.maxSeverity === 'low').length

  return (
    <div
      className="glass rounded-[1.5rem] flex flex-col gap-4 transition-all duration-200 hover:-translate-y-0.5"
      style={{ padding: '1.25rem', borderColor: `${cfg.color}30` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: cfg.bg }}
          >
            <span className="material-symbols-outlined text-xl" style={{ color: cfg.color }}>folder</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-[#e4e1ed] text-sm truncate">{repo.name}</span>
              {repo.private && (
                <span className="text-[10px] rounded-full uppercase tracking-widest"
                  style={{ padding: '0.125rem 0.375rem', background: 'rgba(144,143,160,0.15)', color: '#908fa0' }}>
                  privado
                </span>
              )}
            </div>
            {repo.language && (
              <span className="text-xs text-[#908fa0]">{repo.language}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span
            className="text-2xl font-black"
            style={{ color: cfg.color, fontFamily: 'Space Grotesk' }}
          >
            {repo.count}
          </span>
          <span className="text-xs text-[#908fa0] leading-tight">vulns</span>
        </div>
      </div>

      {/* Severity breakdown */}
      <div className="flex items-center gap-2 flex-wrap">
        {critCount > 0 && <SevBadge severity="critical" count={critCount} />}
        {highCount > 0 && <SevBadge severity="high" count={highCount} />}
        {medCount  > 0 && <SevBadge severity="medium" count={medCount} />}
        {lowCount  > 0 && <SevBadge severity="low" count={lowCount} />}
        {fixable && (
          <span
            className="inline-flex items-center gap-1 rounded-full text-xs font-semibold ml-auto"
            style={{ padding: '0.125rem 0.5rem', background: 'rgba(129,201,149,0.15)', color: '#81c995' }}
          >
            <span className="material-symbols-outlined text-xs">auto_fix_high</span>
            Fix disponible
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <button
          onClick={() => setSelectedRepo(repo)}
          className="flex-1 rounded-xl text-xs font-semibold transition-all duration-200 hover:bg-white/10 glass"
          style={{ padding: '0.5rem', color: '#c7c4d7' }}
        >
          <span className="flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-sm">search</span>
            Ver detalle
          </span>
        </button>
        <button
          onClick={() => onFix(repo)}
          className="flex-1 rounded-xl text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
          style={{
            padding: '0.5rem',
            background: `linear-gradient(135deg, ${cfg.color}40, ${cfg.color}20)`,
            border: `1px solid ${cfg.color}50`,
            color: cfg.color,
          }}
        >
          <span className="flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-sm">build_circle</span>
            Corregir
          </span>
        </button>
      </div>
    </div>
  )
}
