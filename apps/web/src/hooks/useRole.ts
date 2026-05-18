import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export type Role = 'owner' | 'viewer'

export interface RoleInfo {
  role: Role
  ownerUserId: string | null
  isLoading: boolean
}

export function useRole(userId: string | null): RoleInfo {
  const { data, isLoading } = useQuery({
    queryKey: ['role', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('family_members')
        .select('viewer_user_id, owner_user_id, role')
        .eq('viewer_user_id', userId)
        .single()
      if (error || !data) return null
      return data
    },
  })

  if (!userId) return { role: 'owner', ownerUserId: null, isLoading: false }
  if (isLoading) return { role: 'owner', ownerUserId: null, isLoading: true }
  if (!data) return { role: 'owner', ownerUserId: null, isLoading: false }

  return { role: 'viewer', ownerUserId: data.owner_user_id, isLoading: false }
}
