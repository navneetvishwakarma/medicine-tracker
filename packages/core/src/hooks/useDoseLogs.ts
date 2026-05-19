import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRepositories } from '../context/RepositoryContext'
import type { DoseLog } from '../types'

export function useDoseLogsForDate(date: string) {
  const { doseLogs } = useRepositories()
  return useQuery({
    queryKey: ['doseLogs', date],
    queryFn: () => doseLogs.getByDate(date),
    staleTime: Infinity,
  })
}

export function useDoseLogsForRange(from: string, to: string) {
  const { doseLogs } = useRepositories()
  return useQuery({
    queryKey: ['doseLogs', 'range', from, to],
    queryFn: () => doseLogs.getByRange(from, to),
    staleTime: Infinity,
    enabled: Boolean(from && to),
  })
}

export function useUpsertDoseLog() {
  const { doseLogs } = useRepositories()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (log: DoseLog) => doseLogs.upsert(log),
    onSuccess: (_data, log) => {
      qc.invalidateQueries({ queryKey: ['doseLogs', log.scheduledDate] })
      qc.invalidateQueries({ queryKey: ['doseLogs', 'range'] })
    },
  })
}
