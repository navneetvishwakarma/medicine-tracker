import { useEffect } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useRealtimeSync(userId: string | null, queryClient: QueryClient) {
  useEffect(() => {
    if (!userId) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channel = (supabase.channel(`dose_logs:${userId}`) as any)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dose_logs',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['doseLogs'] })
        },
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [userId, queryClient])
}
