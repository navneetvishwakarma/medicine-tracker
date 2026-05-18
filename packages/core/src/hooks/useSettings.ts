import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRepositories } from '../context/RepositoryContext'
import type { AppSettings } from '../types'

const QUERY_KEY = ['settings'] as const

export function useSettings() {
  const { settings } = useRepositories()
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => settings.get(),
    staleTime: Infinity,
  })
}

export function useUpdateSettings() {
  const { settings } = useRepositories()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (partial: Partial<Omit<AppSettings, 'id'>>) => settings.update(partial),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}
