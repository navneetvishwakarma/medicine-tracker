import { useEffect } from 'react'
import { useUIStore } from '@/store/useUIStore'

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
    <div className="fixed bottom-24 left-0 right-0 flex flex-col items-center gap-2 z-50 px-4 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg pointer-events-auto ${
            t.type === 'success'
              ? 'bg-green-800 text-white'
              : t.type === 'error'
                ? 'bg-red-700 text-white'
                : 'bg-gray-800 text-white'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
