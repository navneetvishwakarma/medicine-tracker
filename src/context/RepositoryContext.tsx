import { createContext, useContext, type ReactNode } from 'react'
import { DexieDoseLogRepository } from '@/repositories/dexie/DoseLogRepository'
import { DexieMedicineRepository } from '@/repositories/dexie/MedicineRepository'
import { DexieSettingsRepository } from '@/repositories/dexie/SettingsRepository'
import type { IDoseLogRepository, IMedicineRepository, ISettingsRepository } from '@/repositories/types'

interface RepositoryContextValue {
  medicines: IMedicineRepository
  doseLogs: IDoseLogRepository
  settings: ISettingsRepository
}

const defaultRepos: RepositoryContextValue = {
  medicines: new DexieMedicineRepository(),
  doseLogs: new DexieDoseLogRepository(),
  settings: new DexieSettingsRepository(),
}

const RepositoryContext = createContext<RepositoryContextValue>(defaultRepos)

export function RepositoryProvider({ children, value = defaultRepos }: {
  children: ReactNode
  value?: RepositoryContextValue
}) {
  return (
    <RepositoryContext.Provider value={value}>
      {children}
    </RepositoryContext.Provider>
  )
}

export function useRepositories() {
  return useContext(RepositoryContext)
}
