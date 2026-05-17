import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { getUser } from '../services/github'

const STEPS_FINEGRAINED = [
  { text: 'Ve a', link: 'github.com/settings/tokens', url: 'https://github.com/settings/tokens' },
  { text: 'Haz clic en "Generate new token" → Fine-grained token', link: null },
  { text: 'En "Repository access" selecciona "All repositories" (incluso repos privados)', link: null },
  { text: 'Activa los permisos: Contents (R/W), Pull requests (R/W), Actions (R/W), Dependabot alerts (R)', link: null },
  { text: 'Genera el token y pégalo abajo', link: null },
]

const STEPS_CLASSIC = [
  { text: 'Ve a', link: 'github.com/settings/tokens', url: 'https://github.com/settings/tokens' },
  { text: 'Haz clic en "Generate new token (classic)"', link: null },
  { text: 'Activa los scopes: repo (completo) + workflow + read:org', link: null },
  { text: 'El scope "workflow" es obligatorio para poder subir archivos a .github/workflows/', link: null },
  { text: 'Genera el token y pégalo abajo', link: null },
]

const PERMS_FINEGRAINED = [
  ['Contents', 'Read & Write'],
  ['Pull requests', 'Read & Write'],
  ['Actions', 'Read & Write'],
  ['Dependabot alerts', 'Read-only'],
]

const PERMS_CLASSIC = [
  ['repo', 'Full control'],
  ['workflow', 'Read & Write ⚠️'],
  ['read:org', 'Read-only'],
]

export default function AuthPage() {
  const navigate = useNavigate()
  const setToken = useStore(s => s.setToken)
  const setUser = useStore(s => s.setUser)

  const [input, setInput] = useState('')
  const [masked, setMasked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tokenType, setTokenType] = useState('finegrained')

  async function handleSubmit(e) {
    e.preventDefault()
    const token = input.trim()
    if (!token) return

    setLoading(true)
    setError('')
    try {
      const user = await getUser(token)
      setToken(token)
      setUser(user)
      setMasked(true)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Token inválido o sin permisos suficientes.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Back to landing */}
      <nav className="sticky top-0 z-50 glass-strong border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-[#908fa0] hover:text-[#c0c1ff] transition-colors text-sm"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
            Volver al inicio
          </button>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined filled text-[#c0c1ff]">security</span>
            <span className="font-bold text-sm text-[#e4e1ed]">GitHub Vuln Checker</span>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl">
          {/* Header */}
          <div className="text-center mb-10">
            <div
              className="w-20 h-20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(192,193,255,0.1)', border: '1px solid rgba(192,193,255,0.2)' }}
            >
              <span className="material-symbols-outlined filled text-[#c0c1ff] text-4xl">key</span>
            </div>
            <h1 className="text-3xl font-bold text-[#e4e1ed] mb-2">Conecta tu cuenta</h1>
            <p className="text-[#908fa0]">Necesitas un Personal Access Token de GitHub</p>
          </div>

          {/* Instructions card */}
          <div className="glass rounded-[1.5rem] p-6 mb-6">
            <h3 className="text-sm font-semibold text-[#c0c1ff] uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">info</span>
              Cómo obtener tu token
            </h3>

            {/* Token type toggle */}
            <div className="flex gap-2 mb-4 p-1 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)' }}>
              {[
                { id: 'finegrained', label: 'Fine-grained (recomendado)' },
                { id: 'classic', label: 'Classic' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setTokenType(id)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                  style={tokenType === id
                    ? { background: 'rgba(192,193,255,0.15)', color: '#c0c1ff', border: '1px solid rgba(192,193,255,0.3)' }
                    : { background: 'transparent', color: '#908fa0', border: '1px solid transparent' }
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            {tokenType === 'classic' && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-xl mb-4 text-xs"
                style={{ background: 'rgba(255,183,131,0.08)', border: '1px solid rgba(255,183,131,0.25)', color: '#ffb783' }}>
                <span className="material-symbols-outlined text-sm flex-shrink-0 mt-0.5">warning</span>
                <span>Los tokens clásicos requieren el scope <strong>workflow</strong> para poder subir archivos a <code>.github/workflows/</code>. Sin él recibirás "Resource not accessible".</span>
              </div>
            )}

            <ol className="space-y-3">
              {(tokenType === 'finegrained' ? STEPS_FINEGRAINED : STEPS_CLASSIC).map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-[#c7c4d7]">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                    style={{ background: 'rgba(192,193,255,0.15)', color: '#c0c1ff' }}
                  >
                    {i + 1}
                  </span>
                  <span>
                    {step.text}{' '}
                    {step.link && (
                      <a
                        href={step.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#c0c1ff] underline underline-offset-2 hover:text-[#ddb7ff] transition-colors"
                      >
                        {step.link}
                      </a>
                    )}
                  </span>
                </li>
              ))}
            </ol>

            {/* Permissions table */}
            <div className="mt-4 rounded-xl overflow-hidden border border-white/8">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: 'rgba(192,193,255,0.08)' }}>
                    <th className="px-3 py-2 text-left text-[#c0c1ff] font-semibold">
                      {tokenType === 'finegrained' ? 'Permiso' : 'Scope'}
                    </th>
                    <th className="px-3 py-2 text-left text-[#c0c1ff] font-semibold">Acceso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(tokenType === 'finegrained' ? PERMS_FINEGRAINED : PERMS_CLASSIC).map(([p, a]) => (
                    <tr key={p}>
                      <td className="px-3 py-2 text-[#c7c4d7] font-mono">{p}</td>
                      <td className="px-3 py-2">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs"
                          style={{
                            background: a === 'Read-only' ? 'rgba(129,201,149,0.15)'
                              : a.includes('⚠️') ? 'rgba(255,183,131,0.15)'
                              : 'rgba(192,193,255,0.15)',
                            color: a === 'Read-only' ? '#81c995'
                              : a.includes('⚠️') ? '#ffb783'
                              : '#c0c1ff',
                          }}
                        >
                          {a}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Token form */}
          <form onSubmit={handleSubmit} className="glass rounded-[1.5rem] p-6 mt-14">
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined text-[#c0c1ff] text-xl">key</span>
              <label className="text-base font-bold text-[#e4e1ed]">
                Personal Access Token
              </label>
            </div>
            <div className="relative mb-5">
              <input
                type={masked ? 'password' : 'text'}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="github_pat_..."
                className="w-full px-5 rounded-xl font-mono outline-none transition-all duration-200"
                style={{
                  background: 'rgba(11,14,20,0.8)',
                  border: error ? '2px solid rgba(242,139,130,0.6)' : '2px solid rgba(255,255,255,0.12)',
                  color: '#e4e1ed',
                  fontSize: '0.95rem',
                  paddingTop: '1rem',
                  paddingBottom: '1rem',
                  letterSpacing: '0.02em',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(192,193,255,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(192,193,255,0.08)' }}
                onBlur={e => { e.target.style.borderColor = error ? 'rgba(242,139,130,0.6)' : 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none' }}
              />
              <button
                type="button"
                onClick={() => setMasked(m => !m)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#908fa0] hover:text-[#c0c1ff] transition-colors"
              >
                <span className="material-symbols-outlined text-xl">{masked ? 'visibility' : 'visibility_off'}</span>
              </button>
            </div>

            {error && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl mb-5 text-sm"
                style={{ background: 'rgba(242,139,130,0.1)', border: '1px solid rgba(242,139,130,0.3)', color: '#f28b82' }}
              >
                <span className="material-symbols-outlined text-base">error</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-full py-4 rounded-[0.75rem] font-bold text-base transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              style={{
                background: 'linear-gradient(135deg, #c0c1ff 0%, #8083ff 100%)',
                color: '#1000a9',
                boxShadow: '0 4px 24px rgba(192,193,255,0.25)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#1000a9]/30 border-t-[#1000a9] rounded-full animate-spin" />
                  Verificando token...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-xl">login</span>
                  Conectar con GitHub
                </span>
              )}
            </button>

            <p className="text-xs text-[#464554] text-center mt-4">
              Tu token se guarda solo en tu navegador (localStorage). Nunca se envía a servidores externos.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
