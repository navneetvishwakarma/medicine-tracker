import { useEffect } from 'react'
import { useUIStore } from '@/store/useUIStore'

export function useOnlineStatus() {
  const { isOnline, setOnline, addToast } = useUIStore()

  useEffect(() => {
    const onOnline = () => {
      setOnline(true)
      addToast('Back online', 'success')
    }
    const onOffline = () => {
      setOnline(false)
      addToast('You are offline — changes saved locally', 'info')
    }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [setOnline, addToast])

  return isOnline
}
