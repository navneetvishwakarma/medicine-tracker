import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRepositories } from '../context/RepositoryContext'
import type { Medicine } from '../types'

const QUERY_KEY = ['medicines'] as const

export function useMedicines() {
  const { medicines } = useRepositories()
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => medicines.getAll(),
    staleTime: Infinity,
  })
}

export function useSaveMedicine() {
  const { medicines } = useRepositories()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (medicine: Medicine) => medicines.save(medicine),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useArchiveMedicine() {
  const { medicines } = useRepositories()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => medicines.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}
