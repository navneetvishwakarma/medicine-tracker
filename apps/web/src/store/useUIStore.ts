import { create } from 'zustand'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface UIState {
  // Navigation
  activeDate: string // YYYY-MM-DD
  setActiveDate: (date: string) => void

  // Missed dose banner
  missedBannerDismissed: boolean
  dismissMissedBanner: () => void

  // Toasts
  toasts: Toast[]
  addToast: (message: string, type?: Toast['type']) => void
  removeToast: (id: string) => void

  // Online status
  isOnline: boolean
  setOnline: (online: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  activeDate: new Date().toISOString().split('T')[0],
  setActiveDate: (date) => set({ activeDate: date }),

  missedBannerDismissed: false,
  dismissMissedBanner: () => set({ missedBannerDismissed: true }),

  toasts: [],
  addToast: (message, type = 'info') =>
    set((s) => ({
      toasts: [...s.toasts, { id: crypto.randomUUID(), message, type }],
    })),
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  setOnline: (isOnline) => set({ isOnline }),
}))
