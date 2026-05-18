import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { RepositoryContext } from '@medicine-tracker/core'
import type { RepositoryContextValue } from '@medicine-tracker/core'
import { SqliteMedicineRepository } from '@/repositories/sqlite/MedicineRepository'
import { SqliteDoseLogRepository } from '@/repositories/sqlite/DoseLogRepository'
import { SqliteSettingsRepository } from '@/repositories/sqlite/SettingsRepository'
import { initDb } from '@/repositories/sqlite/db'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: Infinity, retry: false } },
})

const sqliteRepos: RepositoryContextValue = {
  medicines: new SqliteMedicineRepository(),
  doseLogs: new SqliteDoseLogRepository(),
  settings: new SqliteSettingsRepository(),
}

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null)
  const [dbReady, setDbReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    initDb().then(() => setDbReady(true))
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (!s) router.replace('/auth')
    })
    return () => listener.subscription.unsubscribe()
  }, [router])

  if (!dbReady) return null

  return (
    <QueryClientProvider client={queryClient}>
      <RepositoryContext.Provider value={sqliteRepos}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth" />
        </Stack>
      </RepositoryContext.Provider>
    </QueryClientProvider>
  )
}
