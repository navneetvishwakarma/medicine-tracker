import { useMemo, type ReactNode } from 'react'
import { RepositoryContext, type RepositoryContextValue } from '@medicine-tracker/core'
import { DexieDoseLogRepository } from '@/repositories/dexie/DoseLogRepository'
import { DexieMedicineRepository } from '@/repositories/dexie/MedicineRepository'
import { DexieSettingsRepository } from '@/repositories/dexie/SettingsRepository'
import { SupabaseDoseLogRepository } from '@/repositories/supabase/DoseLogRepository'
import { SupabaseMedicineRepository } from '@/repositories/supabase/MedicineRepository'
import { SupabaseSettingsRepository } from '@/repositories/supabase/SettingsRepository'

// Re-export so existing callers of @/context/RepositoryContext keep working
export { useRepositories } from '@medicine-tracker/core'

const dexieRepos: RepositoryContextValue = {
  medicines: new DexieMedicineRepository(),
  doseLogs: new DexieDoseLogRepository(),
  settings: new DexieSettingsRepository(),
}

interface Props {
  children: ReactNode
  userId?: string | null
  value?: RepositoryContextValue
}

export function RepositoryProvider({ children, userId, value }: Props) {
  const repos = useMemo<RepositoryContextValue>(() => {
    if (value) return value
    if (userId) {
      return {
        medicines: new SupabaseMedicineRepository(userId),
        doseLogs: new SupabaseDoseLogRepository(userId),
        settings: new SupabaseSettingsRepository(userId),
      }
    }
    return dexieRepos
  }, [userId, value])

  return (
    <RepositoryContext.Provider value={repos}>
      {children}
    </RepositoryContext.Provider>
  )
}
