import { useEffect, useState } from 'react'
import { create } from 'zustand'

// ── Toast store ──────────────────────────────────────────────────────────────
export const useToastStore = create((set) => ({
  toasts: [],
  add: (toast) => set((s) => ({
    toasts: [...s.toasts, { id: Date.now(), ...toast }]
  })),
  remove: (id) => set((s) => ({
    toasts: s.toasts.filter(t => t.id !== id)
  })),
}))

export function toast(msg, type = 'info') {
  useToastStore.getState().add({ msg, type })
}

// ── Single toast item ────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  success: { color: '#81c995', bg: 'rgba(129,201,149,0.15)', border: 'rgba(129,201,149,0.35)', icon: 'check_circle' },
  error:   { color: '#f28b82', bg: 'rgba(242,139,130,0.15)', border: 'rgba(242,139,130,0.35)', icon: 'error' },
  info:    { color: '#c0c1ff', bg: 'rgba(192,193,255,0.1)',  border: 'rgba(192,193,255,0.3)',  icon: 'info' },
  warning: { color: '#fdd663', bg: 'rgba(253,214,99,0.1)',   border: 'rgba(253,214,99,0.3)',   icon: 'warning' },
}

function ToastItem({ id, msg, type }) {
  const remove = useToastStore(s => s.remove)
  const [visible, setVisible] = useState(false)
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.info

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(() => remove(id), 300)
    }, 3500)
    return () => clearTimeout(t)
  }, [id, remove])

  return (
    <div
      onClick={() => { setVisible(false); setTimeout(() => remove(id), 300) }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer max-w-sm w-full transition-all duration-300"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        backdropFilter: 'blur(12px)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        boxShadow: `0 4px 24px ${cfg.color}20`,
      }}
    >
      <span className="material-symbols-outlined filled flex-shrink-0" style={{ color: cfg.color, fontSize: 20 }}>
        {cfg.icon}
      </span>
      <p className="text-sm text-[#e4e1ed] flex-1">{msg}</p>
    </div>
  )
}

// ── Toast container ──────────────────────────────────────────────────────────
export default function ToastContainer() {
  const toasts = useToastStore(s => s.toasts)

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem {...t} />
        </div>
      ))}
    </div>
  )
}
