import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ── Supabase mock ─────────────────────────────────────────────────────────────
const { mockSingle, mockEq, mockSelect, mockFrom, mockSupabase } = vi.hoisted(() => {
  const mockSingle = vi.fn()
  const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })
  const mockSupabase = { from: mockFrom }
  return { mockSingle, mockEq, mockSelect, mockFrom, mockSupabase }
})

vi.mock('@/lib/supabase', () => ({ supabase: mockSupabase }))

import { useRole } from '@/hooks/useRole'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return React.createElement(QueryClientProvider, { client: qc }, children)
}

describe('useRole', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReturnValue({ select: mockSelect })
    mockSelect.mockReturnValue({ eq: mockEq })
  })

  it('returns owner when user has no family_members row as viewer', async () => {
    mockEq.mockReturnValue({ single: vi.fn().mockResolvedValue({ data: null, error: null }) })
    const { result } = renderHook(() => useRole('user-1'), { wrapper })
    await waitFor(() => expect(result.current.role).toBe('owner'))
  })

  it('returns viewer when family_members row exists for the user', async () => {
    mockEq.mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: { viewer_user_id: 'user-2', owner_user_id: 'user-1', role: 'viewer' },
        error: null,
      }),
    })
    const { result } = renderHook(() => useRole('user-2'), { wrapper })
    await waitFor(() => expect(result.current.role).toBe('viewer'))
    expect(result.current.ownerUserId).toBe('user-1')
  })

  it('returns owner when userId is null', async () => {
    const { result } = renderHook(() => useRole(null), { wrapper })
    await waitFor(() => expect(result.current.role).toBe('owner'))
    expect(mockFrom).not.toHaveBeenCalled()
  })
})
