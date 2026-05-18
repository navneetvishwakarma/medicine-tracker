import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Supabase mock ─────────────────────────────────────────────────────────────
const { mockInsert, mockUpsert, mockGte, mockEq2, mockEqSingle, mockSelect2, mockFrom, mockSupabase } =
  vi.hoisted(() => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null })
    const mockUpsert = vi.fn().mockResolvedValue({ error: null })

    // chain for redeemInviteCode: .select().eq().gte().single()
    const mockEqSingle = vi.fn().mockResolvedValue({
      data: { code: 'ABC123', owner_user_id: 'owner-1', used_at: null },
      error: null,
    })
    const mockGte = vi.fn().mockReturnValue({ single: mockEqSingle })
    const mockEq2 = vi.fn().mockReturnValue({ gte: mockGte })
    const mockSelect2 = vi.fn().mockReturnValue({ eq: mockEq2 })

    const mockFrom = vi.fn().mockReturnValue({
      insert: mockInsert,
      upsert: mockUpsert,
      select: mockSelect2,
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    })
    const mockSupabase = { from: mockFrom }
    return { mockInsert, mockUpsert, mockGte, mockEq2, mockEqSingle, mockSelect2, mockFrom, mockSupabase }
  })

vi.mock('@/lib/supabase', () => ({ supabase: mockSupabase }))

import { generateInviteCode, redeemInviteCode } from '@/services/inviteCode'

describe('generateInviteCode', () => {
  beforeEach(() => vi.clearAllMocks())

  it('generates a 6-character alphanumeric code', async () => {
    mockInsert.mockResolvedValue({ error: null })
    const code = await generateInviteCode('owner-1')
    expect(code).toMatch(/^[A-Z0-9]{6}$/)
  })

  it('inserts the code into viewer_invites with 48h expiry', async () => {
    mockInsert.mockResolvedValue({ error: null })
    await generateInviteCode('owner-1')
    expect(mockFrom).toHaveBeenCalledWith('viewer_invites')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ owner_user_id: 'owner-1' }),
    )
  })

  it('throws when insert fails', async () => {
    mockInsert.mockResolvedValue({ error: new Error('DB error') })
    await expect(generateInviteCode('owner-1')).rejects.toThrow('DB error')
  })
})

describe('redeemInviteCode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEqSingle.mockResolvedValue({
      data: { code: 'ABC123', owner_user_id: 'owner-1', used_at: null },
      error: null,
    })
    mockUpsert.mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({
      insert: mockInsert,
      upsert: mockUpsert,
      select: mockSelect2,
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    })
  })

  it('returns ownerUserId on success', async () => {
    const result = await redeemInviteCode('ABC123', 'viewer-1')
    expect(result).toBe('owner-1')
  })

  it('throws when code is not found or expired', async () => {
    mockEqSingle.mockResolvedValue({ data: null, error: new Error('Not found') })
    await expect(redeemInviteCode('BADCODE', 'viewer-1')).rejects.toThrow()
  })

  it('throws when code is already used', async () => {
    mockEqSingle.mockResolvedValue({
      data: { code: 'ABC123', owner_user_id: 'owner-1', used_at: '2026-05-18T00:00:00Z' },
      error: null,
    })
    await expect(redeemInviteCode('ABC123', 'viewer-1')).rejects.toThrow('already used')
  })
})
