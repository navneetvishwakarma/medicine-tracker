import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { DoseLog } from '@medicine-tracker/core'

const { mockBuilder } = vi.hoisted(() => {
  const mockBuilder = {
    select: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
  }
  return { mockBuilder }
})

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn().mockReturnValue(mockBuilder) },
}))

import { SupabaseDoseLogRepository } from '@/repositories/supabase/DoseLogRepository'

const USER_ID = 'user-123'

const dbRow = {
  id: 'log-1',
  user_id: USER_ID,
  medicine_id: 'med-1',
  scheduled_date: '2026-05-18',
  scheduled_time: 'morning',
  status: 'taken',
  marked_at: '2026-05-18T08:05:00.000Z',
  marked_by: null,
  note: null,
}

const expectedLog: DoseLog = {
  id: 'log-1',
  medicineId: 'med-1',
  scheduledDate: '2026-05-18',
  scheduledTime: 'morning',
  status: 'taken',
  markedAt: '2026-05-18T08:05:00.000Z',
}

describe('SupabaseDoseLogRepository', () => {
  let repo: SupabaseDoseLogRepository

  beforeEach(() => {
    vi.clearAllMocks()
    mockBuilder.select.mockReturnThis()
    mockBuilder.upsert.mockReturnThis()
    mockBuilder.eq.mockReturnThis()
    mockBuilder.gte.mockReturnThis()
    mockBuilder.lte.mockReturnThis()
    mockBuilder.order.mockReturnThis()
    repo = new SupabaseDoseLogRepository(USER_ID)
  })

  it('getByDate: queries by scheduled_date and maps to camelCase', async () => {
    mockBuilder.eq.mockResolvedValueOnce({ data: [dbRow], error: null })
    const result = await repo.getByDate('2026-05-18')
    const { supabase } = await import('@/lib/supabase')
    expect(supabase.from).toHaveBeenCalledWith('dose_logs')
    expect(mockBuilder.eq).toHaveBeenCalledWith('scheduled_date', '2026-05-18')
    expect(result[0]).toMatchObject(expectedLog)
  })

  it('getByDate: returns empty array on no rows', async () => {
    mockBuilder.eq.mockResolvedValueOnce({ data: [], error: null })
    const result = await repo.getByDate('2026-05-19')
    expect(result).toHaveLength(0)
  })

  it('getByRange: queries with gte + lte bounds', async () => {
    mockBuilder.lte.mockResolvedValueOnce({ data: [dbRow], error: null })
    const result = await repo.getByRange('2026-05-12', '2026-05-18')
    expect(mockBuilder.gte).toHaveBeenCalledWith('scheduled_date', '2026-05-12')
    expect(mockBuilder.lte).toHaveBeenCalledWith('scheduled_date', '2026-05-18')
    expect(result).toHaveLength(1)
  })

  it('upsert: persists with snake_case columns + user_id', async () => {
    mockBuilder.upsert.mockResolvedValueOnce({ data: null, error: null })
    const log: DoseLog = {
      id: 'log-2',
      medicineId: 'med-1',
      scheduledDate: '2026-05-18',
      scheduledTime: 'noon',
      status: 'skipped',
      note: 'Felt nauseous',
    }
    await repo.upsert(log)
    const { supabase } = await import('@/lib/supabase')
    expect(supabase.from).toHaveBeenCalledWith('dose_logs')
    expect(mockBuilder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'log-2',
        user_id: USER_ID,
        medicine_id: 'med-1',
        scheduled_date: '2026-05-18',
        scheduled_time: 'noon',
        status: 'skipped',
        note: 'Felt nauseous',
      }),
    )
  })

  it('upsert: throws on Supabase error', async () => {
    mockBuilder.upsert.mockResolvedValueOnce({ data: null, error: { message: 'constraint violation' } })
    await expect(
      repo.upsert({ id: 'x', medicineId: 'm', scheduledDate: '2026-01-01', scheduledTime: 'morning', status: 'pending' }),
    ).rejects.toEqual({ message: 'constraint violation' })
  })
})
