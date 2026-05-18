import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import React from 'react'

// ── Supabase mock ─────────────────────────────────────────────────────────────
const { mockChannel, mockSupabase } = vi.hoisted(() => {
  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
    unsubscribe: vi.fn(),
  }
  const mockSupabase = {
    channel: vi.fn().mockReturnValue(mockChannel),
    from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnThis() }),
  }
  return { mockChannel, mockSupabase }
})

vi.mock('@/lib/supabase', () => ({ supabase: mockSupabase }))

import { useRealtimeSync } from '@/hooks/useRealtimeSync'

describe('useRealtimeSync', () => {
  let qc: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    mockChannel.on.mockReturnThis()
    mockChannel.subscribe.mockReturnThis()
    mockSupabase.channel.mockReturnValue(mockChannel)
    qc = new QueryClient()
  })

  it('subscribes to dose_logs changes for the user', () => {
    const { unmount } = renderHook(
      () => useRealtimeSync('user-1', qc),
      {
        wrapper: ({ children }) =>
          React.createElement(React.Fragment, null, children),
      },
    )
    expect(mockSupabase.channel).toHaveBeenCalledWith(expect.stringContaining('dose_logs'))
    expect(mockChannel.on).toHaveBeenCalled()
    expect(mockChannel.subscribe).toHaveBeenCalled()
    unmount()
  })

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useRealtimeSync('user-1', qc), {
      wrapper: ({ children }) => React.createElement(React.Fragment, null, children),
    })
    unmount()
    expect(mockChannel.unsubscribe).toHaveBeenCalled()
  })

  it('does not subscribe when userId is null', () => {
    renderHook(() => useRealtimeSync(null, qc), {
      wrapper: ({ children }) => React.createElement(React.Fragment, null, children),
    })
    expect(mockSupabase.channel).not.toHaveBeenCalled()
  })
})
