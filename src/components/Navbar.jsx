import { useNavigate, useLocation } from 'react-router-dom'
import useStore from '../store/useStore'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useStore(s => s.user)
  const logout = useStore(s => s.logout)

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: 'shield_with_heart' },
    { path: '/stats', label: 'Estadísticas', icon: 'bar_chart' },
  ]

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-50 glass-strong border-b border-white/5">
      <div className="max-w-6xl mx-auto h-16 flex items-center justify-between gap-4" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 flex-shrink-0"
        >
          <span className="material-symbols-outlined filled text-[#c0c1ff] text-2xl">security</span>
          <span className="font-bold text-[#e4e1ed] hidden sm:block">GitHub Vuln Checker</span>
        </button>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {navLinks.map(({ path, label, icon }) => {
            const active = location.pathname === path
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="flex items-center gap-2 rounded-xl text-sm font-medium transition-all duration-200"
                style={active ? {
                  padding: '0.5rem 1rem',
                  background: 'rgba(192,193,255,0.15)',
                  color: '#c0c1ff',
                  border: '1px solid rgba(192,193,255,0.3)',
                } : {
                  padding: '0.5rem 1rem',
                  color: '#908fa0',
                  border: '1px solid transparent',
                }}
              >
                <span className={`material-symbols-outlined text-base ${active ? 'filled' : ''}`}>{icon}</span>
                <span className="hidden sm:block">{label}</span>
              </button>
            )
          })}
        </div>

        {/* User + logout */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {user && (
            <div className="flex items-center gap-2">
              <img
                src={user.avatar_url}
                alt={user.login}
                className="w-8 h-8 rounded-full"
                style={{ border: '2px solid rgba(192,193,255,0.3)' }}
              />
              <span className="text-sm text-[#c7c4d7] hidden md:block">{user.login}</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 rounded-xl text-sm text-[#908fa0] hover:text-[#f28b82] hover:bg-white/5 transition-all duration-200"
            style={{ padding: '0.5rem 0.75rem' }}
            title="Cerrar sesión"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            <span className="hidden sm:block">Salir</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
