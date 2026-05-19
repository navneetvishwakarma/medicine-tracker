import { createContext, useContext } from 'react'
import type { IDoseLogRepository, IMedicineRepository, ISettingsRepository } from '../repositories/types'

export interface RepositoryContextValue {
  medicines: IMedicineRepository
  doseLogs: IDoseLogRepository
  settings: ISettingsRepository
}

export const RepositoryContext = createContext<RepositoryContextValue | null>(null)

export function useRepositories(): RepositoryContextValue {
  const ctx = useContext(RepositoryContext)
  if (!ctx) throw new Error('useRepositories must be used within a RepositoryProvider')
  return ctx
}
