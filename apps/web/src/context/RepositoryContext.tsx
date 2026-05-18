import type { ReactNode } from 'react'
import { RepositoryContext } from '@medicine-tracker/core'
import { DexieDoseLogRepository } from '@/repositories/dexie/DoseLogRepository'
import { DexieMedicineRepository } from '@/repositories/dexie/MedicineRepository'
import { DexieSettingsRepository } from '@/repositories/dexie/SettingsRepository'

// Re-export useRepositories so existing callers of @/context/RepositoryContext keep working
export { useRepositories } from '@medicine-tracker/core'

const defaultRepos = {
  medicines: new DexieMedicineRepository(),
  doseLogs: new DexieDoseLogRepository(),
  settings: new DexieSettingsRepository(),
}

export function RepositoryProvider({
  children,
  value = defaultRepos,
}: {
  children: ReactNode
  value?: typeof defaultRepos
}) {
  return (
    <RepositoryContext.Provider value={value}>
      {children}
    </RepositoryContext.Provider>
  )
}
