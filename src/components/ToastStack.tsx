import { useEffect } from 'react'
import { useUIStore } from '@/store/useUIStore'

const TOAST_STYLES = {
  success: 'bg-gray-900 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-gray-900 text-white',
}

const TOAST_ACCENT = {
  success: 'bg-green-400',
  error: 'bg-red-300',
  info: 'bg-blue-400',
}

export default function ToastStack() {
  const { toasts, removeToast } = useUIStore()

  useEffect(() => {
    if (toasts.length === 0) return
    const latest = toasts[toasts.length - 1]
    const timer = setTimeout(() => removeToast(latest.id), 3000)
    return () => clearTimeout(timer)
  }, [toasts, removeToast])

  if (toasts.length === 0) return null

  return (
    <div
      className="fixed bottom-[72px] left-0 right-0 flex flex-col items-center gap-2 z-50 px-4 pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 pl-1 pr-4 py-1 rounded-full shadow-lg pointer-events-auto ${TOAST_STYLES[t.type]}`}
          style={{ fontSize: 14, boxShadow: '0 4px 16px rgba(28,28,26,0.2)' }}
        >
          <div className={`w-5 h-5 rounded-full shrink-0 ${TOAST_ACCENT[t.type]}`} />
          <span className="font-medium">{t.message}</span>
        </div>
      ))}
    </div>
  )
}
