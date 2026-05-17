import { useState } from 'react'
import useStore from '../store/useStore'
import { pushWorkflowAndFix } from '../services/github'
import { toast } from './Toast'

export default function FixModal({ repo, onClose }) {
  const token = useStore(s => s.token)
  const user = useStore(s => s.user)
  const addFixHistory = useStore(s => s.addFixHistory)

  const [step, setStep] = useState('disclaimer') // disclaimer | running | done | error
  const [accepted, setAccepted] = useState(false)
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleFix() {
    setStep('running')
    try {
      const res = await pushWorkflowAndFix(token, user.login, repo.name)
      setResult(res)
      addFixHistory({
        repo: repo.name,
        timestamp: new Date().toISOString(),
        workflowUrl: res.workflowUrl,
        vulns: repo.count,
      })
      setStep('done')
      toast(`Workflow lanzado en ${repo.name}`, 'success')
    } catch (err) {
      setErrorMsg(err.message || 'Error al lanzar el workflow.')
      setStep('error')
      toast('Error al lanzar el workflow', 'error')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={step === 'running' ? undefined : onClose}
    >
      <div
        className="glass rounded-[1.5rem] p-8 w-full max-w-lg"
        onClick={e => e.stopPropagation()}
      >
        {/* ── DISCLAIMER ── */}
        {step === 'disclaimer' && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,183,131,0.15)' }}
              >
                <span className="material-symbols-outlined text-[#ffb783] text-2xl">warning</span>
              </div>
              <div>
                <h2 className="font-bold text-[#e4e1ed]">Confirmar corrección</h2>
                <p className="text-sm text-[#908fa0]">{repo.name} · {repo.count} vulnerabilidades</p>
              </div>
            </div>

            <div
              className="rounded-xl p-4 mb-6 text-sm text-[#c7c4d7] leading-relaxed space-y-3"
              style={{ background: 'rgba(255,183,131,0.05)', border: '1px solid rgba(255,183,131,0.2)' }}
            >
              <p>Esta acción realizará lo siguiente en tu repositorio <strong className="text-[#e4e1ed]">{repo.name}</strong>:</p>
              <ul className="space-y-1.5 ml-2">
                {[
                  'Creará o actualizará el archivo .github/workflows/security-fix.yml',
                  'Disparará el workflow de GitHub Actions inmediatamente',
                  'El workflow ejecutará npm audit fix --force',
                  'Se abrirá un Pull Request con los cambios en la rama security-fix-auto',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[#ffb783] text-sm mt-0.5">chevron_right</span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="font-semibold text-[#e4e1ed]">
                Eres el único responsable de revisar y mergear el Pull Request resultante.
                Algunos cambios pueden requerir actualizaciones en tu código.
              </p>
            </div>

            <label className="flex items-start gap-3 mb-6 cursor-pointer">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={e => setAccepted(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center transition-all duration-200"
                  style={{
                    background: accepted ? '#c0c1ff' : 'transparent',
                    border: accepted ? '2px solid #c0c1ff' : '2px solid rgba(144,143,160,0.5)',
                  }}
                >
                  {accepted && <span className="material-symbols-outlined text-[#1000a9] text-sm">check</span>}
                </div>
              </div>
              <span className="text-sm text-[#c7c4d7] leading-relaxed">
                He leído el aviso anterior y entiendo que soy responsable de revisar los cambios generados en mi repositorio.
              </span>
            </label>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-[0.75rem] font-semibold text-sm glass transition-all duration-200 hover:bg-white/10"
                style={{ color: '#908fa0' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleFix}
                disabled={!accepted}
                className="flex-1 py-3 rounded-[0.75rem] font-bold text-sm transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                style={{
                  background: 'linear-gradient(135deg, #c0c1ff 0%, #8083ff 100%)',
                  color: '#1000a9',
                  boxShadow: accepted ? '0 4px 24px rgba(192,193,255,0.2)' : 'none',
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-xl">rocket_launch</span>
                  Lanzar corrección
                </span>
              </button>
            </div>
          </>
        )}

        {/* ── RUNNING ── */}
        {step === 'running' && (
          <div className="text-center py-6">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div
                className="w-20 h-20 rounded-full border-4 animate-spin"
                style={{ borderColor: 'rgba(192,193,255,0.2)', borderTopColor: '#c0c1ff' }}
              />
              <span className="material-symbols-outlined filled text-[#c0c1ff] text-3xl absolute inset-0 flex items-center justify-center m-auto">
                build_circle
              </span>
            </div>
            <h3 className="font-bold text-[#e4e1ed] text-lg mb-2">Lanzando corrección...</h3>
            <p className="text-sm text-[#908fa0]">Subiendo workflow a GitHub Actions</p>
          </div>
        )}

        {/* ── DONE ── */}
        {step === 'done' && result && (
          <>
            <div className="text-center mb-6">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(129,201,149,0.15)', border: '2px solid rgba(129,201,149,0.4)' }}
              >
                <span className="material-symbols-outlined filled text-[#81c995] text-4xl">check_circle</span>
              </div>
              <h3 className="font-bold text-[#e4e1ed] text-xl mb-1">¡Workflow lanzado!</h3>
              <p className="text-sm text-[#908fa0]">GitHub Actions procesará el fix en unos minutos</p>
            </div>

            <div
              className="rounded-xl p-4 mb-6 space-y-3"
              style={{ background: 'rgba(129,201,149,0.05)', border: '1px solid rgba(129,201,149,0.2)' }}
            >
              {[
                { icon: 'schedule', text: 'El workflow tardará ~2-5 minutos en completarse' },
                { icon: 'merge_type', text: 'Se creará un PR en la rama security-fix-auto' },
                { icon: 'reviews', text: 'Revisa los cambios antes de hacer merge' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-sm text-[#c7c4d7]">
                  <span className="material-symbols-outlined text-[#81c995] text-base">{icon}</span>
                  {text}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-[0.75rem] font-semibold text-sm glass transition-all duration-200 hover:bg-white/10"
                style={{ color: '#908fa0' }}
              >
                Cerrar
              </button>
              <a
                href={result.workflowUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 rounded-[0.75rem] font-bold text-sm text-center transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, #81c995, #4caf6e)',
                  color: '#0a1f0f',
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-xl">open_in_new</span>
                  Ver en GitHub Actions
                </span>
              </a>
            </div>
          </>
        )}

        {/* ── ERROR ── */}
        {step === 'error' && (
          <>
            <div className="text-center mb-6">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(242,139,130,0.15)', border: '2px solid rgba(242,139,130,0.4)' }}
              >
                <span className="material-symbols-outlined filled text-[#f28b82] text-4xl">error</span>
              </div>
              <h3 className="font-bold text-[#e4e1ed] text-xl mb-2">Error al lanzar</h3>
              <p className="text-sm text-[#908fa0] bg-black/20 rounded-xl px-4 py-2">{errorMsg}</p>
            </div>
            <div className="text-xs text-[#464554] text-center mb-4 space-y-1">
              <p>Tokens <strong className="text-[#908fa0]">fine-grained</strong>: necesitan Contents y Actions (R/W) + "All repositories".</p>
              <p>Tokens <strong className="text-[#908fa0]">clásicos</strong>: necesitan el scope <code className="text-[#ffb783]">workflow</code> además de <code className="text-[#908fa0]">repo</code>.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 rounded-[0.75rem] font-semibold text-sm glass" style={{ color: '#908fa0' }}>
                Cerrar
              </button>
              <button
                onClick={() => { setStep('disclaimer'); setAccepted(false) }}
                className="flex-1 py-3 rounded-[0.75rem] font-bold text-sm"
                style={{ background: 'rgba(242,139,130,0.15)', color: '#f28b82', border: '1px solid rgba(242,139,130,0.3)' }}
              >
                Reintentar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
