import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const STEPS = [
  {
    icon: 'search',
    number: '01',
    title: 'Escanear',
    desc: 'Conectamos con la API de GitHub y analizamos todas tus alertas de Dependabot en tiempo real.',
    color: '#c0c1ff',
  },
  {
    icon: 'analytics',
    number: '02',
    title: 'Analizar',
    desc: 'Agrupamos vulnerabilidades por paquete, severidad y CVE. Ves exactamente qué hay que arreglar.',
    color: '#ddb7ff',
  },
  {
    icon: 'build_circle',
    number: '03',
    title: 'Corregir',
    desc: 'Generamos un workflow de GitHub Actions que abre un PR automático con las dependencias actualizadas.',
    color: '#ffb783',
  },
]

const FEATURES = [
  { icon: 'shield', text: 'Sin instalar nada — todo en el navegador' },
  { icon: 'lock', text: 'Tu token nunca sale de tu dispositivo' },
  { icon: 'bolt', text: 'Escaneo masivo de todos tus repos en segundos' },
  { icon: 'auto_fix_high', text: 'Fix automático vía GitHub Actions' },
  { icon: 'bar_chart', text: 'Estadísticas y historial de correcciones' },
  { icon: 'filter_list', text: 'Filtros por severidad, lenguaje y estado' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)

  return (
    <div className="min-h-screen">
      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 glass-strong border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined filled text-[#c0c1ff] text-2xl">security</span>
            <span className="font-bold text-[#e4e1ed]">GitHub Vuln Checker</span>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-[0.75rem] text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #c0c1ff, #8083ff)', color: '#1000a9' }}
          >
            Iniciar sesión
          </button>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="w-full px-6 pt-24 flex flex-col items-center" style={{ paddingBottom: '7rem' }}>
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-8"
          style={{ background: 'rgba(192,193,255,0.1)', border: '1px solid rgba(192,193,255,0.3)', color: '#c0c1ff' }}
        >
          <span className="w-2 h-2 rounded-full bg-[#c0c1ff] pulse-dot" />
          Herramienta gratuita · Open Source
        </div>

        <h1 className="text-5xl md:text-6xl font-black leading-[1.1] tracking-tight mb-6 max-w-4xl text-center">
          Detecta y corrige{' '}
          <span className="accent-text">vulnerabilidades</span>
          <br />en tus repos de GitHub
        </h1>

        <p className="text-lg text-[#c7c4d7] max-w-2xl mb-12 leading-relaxed text-center">
          Escanea todas tus alertas de Dependabot, analiza qué paquetes necesitan actualización
          y lanza correcciones automáticas con un solo clic. Sin instalar nada.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-4 rounded-[0.75rem] text-base font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #c0c1ff 0%, #6f00be 100%)',
              color: '#fff',
              boxShadow: '0 8px 32px rgba(192,193,255,0.25)',
            }}
          >
            <span className="flex items-center gap-2 justify-center">
              <span className="material-symbols-outlined text-xl">rocket_launch</span>
              Comenzar ahora — gratis
            </span>
          </button>
          <button
            onClick={() => setDisclaimerOpen(true)}
            className="px-8 py-4 rounded-[0.75rem] text-base font-semibold transition-all duration-200 hover:-translate-y-0.5 glass"
            style={{ color: '#c7c4d7' }}
          >
            <span className="flex items-center gap-2 justify-center">
              <span className="material-symbols-outlined text-xl">gavel</span>
              Ver términos de uso
            </span>
          </button>
        </div>
      </section>

      {/* ── STATS STRIP ────────────────────────────────────── */}
      <section className="w-full px-6" style={{ marginBottom: '8rem' }}>
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { value: '100%', label: 'En el navegador', icon: 'public' },
            { value: '0', label: 'Datos almacenados', icon: 'storage' },
            { value: '∞', label: 'Repos soportados', icon: 'folder_open' },
          ].map(({ value, label, icon }) => (
            <div key={label} className="glass rounded-[1.5rem] p-6 flex sm:flex-col items-center sm:items-center gap-4 sm:gap-2 sm:text-center">
              <span className="material-symbols-outlined text-[#c0c1ff] text-3xl block flex-shrink-0">{icon}</span>
              <div className="flex-1 sm:flex-none text-left sm:text-center">
                <div className="text-3xl font-black text-[#e4e1ed] sm:mb-1">{value}</div>
                <div className="text-xs text-[#908fa0] uppercase tracking-widest">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <section className="w-full px-6" style={{ marginBottom: '8rem' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#e4e1ed] mb-3">¿Cómo funciona?</h2>
            <p className="text-[#908fa0]">Tres pasos. Sin configuración. Sin servidores propios.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className="glass rounded-[1.5rem] p-8 flex flex-col items-center text-center gap-5 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
              >
                <span
                  className="absolute top-4 left-5 text-5xl font-black opacity-10 select-none"
                  style={{ color: step.color, fontFamily: 'Space Grotesk' }}
                >
                  {step.number}
                </span>
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 mt-4"
                  style={{ background: `${step.color}20` }}
                >
                  <span className="material-symbols-outlined text-3xl" style={{ color: step.color }}>
                    {step.icon}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#e4e1ed]">{step.title}</h3>
                <p className="text-[#c7c4d7] leading-relaxed text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ──────────────────────────────────── */}
      <section className="w-full px-6" style={{ marginBottom: '8rem' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#e4e1ed] mb-3">Todo lo que necesitas</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon, text }) => (
              <div key={text} className="glass rounded-[1rem] px-5 py-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(192,193,255,0.1)' }}>
                  <span className="material-symbols-outlined text-[#c0c1ff]">{icon}</span>
                </div>
                <span className="text-[#c7c4d7] text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DISCLAIMER SECTION ─────────────────────────────── */}
      <section className="w-full px-6" style={{ marginBottom: '8rem' }}>
        <div className="max-w-4xl mx-auto">
        <div
          className="rounded-[1.5rem] p-8"
          style={{ background: 'rgba(255,183,131,0.05)', border: '1px solid rgba(255,183,131,0.2)' }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,183,131,0.15)' }}
            >
              <span className="material-symbols-outlined text-[#ffb783] text-2xl">gavel</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#ffb783] mb-3">Descargo de responsabilidad</h3>
              <div className="space-y-2 text-sm text-[#c7c4d7] leading-relaxed">
                <p>
                  Esta herramienta es un auxiliar técnico que automatiza procesos comunes de actualización
                  de dependencias. <strong className="text-[#e4e1ed]">El usuario es el único responsable</strong> de
                  revisar, testear y mergear cualquier cambio aplicado a sus repositorios.
                </p>
                <p>
                  Los Pull Requests generados automáticamente pueden introducir cambios en versiones major
                  que requieran ajustes en el código. <strong className="text-[#e4e1ed]">Revisa siempre los cambios
                  antes de mergear</strong>.
                </p>
                <p>
                  Esta herramienta no almacena tu token de GitHub ni ningún dato de tus repositorios en
                  servidores externos. Todo el procesamiento ocurre en tu navegador.
                </p>
                <p>
                  El uso de esta herramienta implica la aceptación de estos términos. No nos hacemos
                  responsables de daños directos o indirectos derivados de su uso.
                </p>
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* ── CTA FINAL ──────────────────────────────────────── */}
      <section className="w-full px-6 text-center" style={{ marginBottom: '6rem' }}>
        <div className="max-w-4xl mx-auto">
        <div
          className="rounded-[2rem] p-8 sm:p-12"
          style={{
            background: 'rgba(192,193,255,0.05)',
            border: '1px solid rgba(192,193,255,0.15)',
            backgroundImage: 'radial-gradient(at 50% 0%, rgba(192,193,255,0.1) 0px, transparent 70%)',
          }}
        >
          <h2 className="text-3xl font-bold text-[#e4e1ed] mb-4">
            ¿Listo para asegurar tus repos?
          </h2>
          <p className="text-[#908fa0] mb-8">Solo necesitas un GitHub Personal Access Token. Tarda 2 minutos.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-10 py-4 rounded-[0.75rem] text-base font-bold transition-all duration-200 hover:-translate-y-1 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #c0c1ff 0%, #8083ff 100%)',
              color: '#1000a9',
              boxShadow: '0 8px 32px rgba(192,193,255,0.3)',
            }}
          >
            Empezar ahora
          </button>
        </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 text-center text-sm text-[#464554]">
        GitHub Vulnerability Checker · Herramienta open source · No afiliada con GitHub ni Microsoft
      </footer>

      {/* ── DISCLAIMER MODAL ───────────────────────────────── */}
      {disclaimerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setDisclaimerOpen(false)}
        >
          <div
            className="glass rounded-[1.5rem] p-8 max-w-xl w-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#e4e1ed] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ffb783]">gavel</span>
                Términos de uso
              </h2>
              <button onClick={() => setDisclaimerOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                <span className="material-symbols-outlined text-[#908fa0]">close</span>
              </button>
            </div>
            <div className="space-y-4 text-sm text-[#c7c4d7] leading-relaxed">
              <p><strong className="text-[#e4e1ed]">1. Responsabilidad del usuario.</strong> El usuario es el único responsable de las acciones realizadas en sus repositorios. Esta herramienta genera PRs automáticos que deben ser revisados antes de mergear.</p>
              <p><strong className="text-[#e4e1ed]">2. Privacidad del token.</strong> Tu Personal Access Token de GitHub se almacena únicamente en el localStorage de tu navegador y se usa exclusivamente para llamadas a la API de GitHub. Nunca se envía a servidores de terceros.</p>
              <p><strong className="text-[#e4e1ed]">3. Sin garantías.</strong> Esta herramienta se proporciona "tal cual", sin garantías de ningún tipo. Las actualizaciones automáticas pueden introducir breaking changes.</p>
              <p><strong className="text-[#e4e1ed]">4. Uso aceptable.</strong> Esta herramienta solo debe usarse en repositorios propios o en los que tengas permisos explícitos para modificar dependencias.</p>
              <p><strong className="text-[#e4e1ed]">5. Limitación de responsabilidad.</strong> Los autores no se hacen responsables de daños directos, indirectos o consecuentes derivados del uso de esta herramienta.</p>
            </div>
            <button
              onClick={() => setDisclaimerOpen(false)}
              className="w-full mt-6 py-3 rounded-[0.75rem] font-semibold transition-all duration-200 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #c0c1ff, #8083ff)', color: '#1000a9' }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
