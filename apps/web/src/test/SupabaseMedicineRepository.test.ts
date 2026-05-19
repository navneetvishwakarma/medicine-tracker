import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Medicine } from '@medicine-tracker/core'

// ── vi.hoisted ensures mockBuilder is defined before vi.mock hoisting ─────────
const { mockBuilder } = vi.hoisted(() => {
  const mockBuilder = {
    select: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
  }
  return { mockBuilder }
})

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn().mockReturnValue(mockBuilder) },
}))

import { SupabaseMedicineRepository } from '@/repositories/supabase/MedicineRepository'

const USER_ID = 'user-123'

const dbRow = {
  id: 'med-1',
  user_id: USER_ID,
  name: 'Aspirin',
  dosage: '100 mg',
  meal_relation: 'before',
  schedules: [{ time: 'morning', hour: 8, minute: 0 }],
  color: 'blue',
  notes: null,
  active: true,
  created_at: '2026-01-01T00:00:00.000Z',
}

const expected: Medicine = {
  id: 'med-1',
  name: 'Aspirin',
  dosage: '100 mg',
  mealRelation: 'before',
  schedules: [{ time: 'morning', hour: 8, minute: 0 }],
  color: 'blue',
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
}

describe('SupabaseMedicineRepository', () => {
  let repo: SupabaseMedicineRepository

  beforeEach(() => {
    vi.clearAllMocks()
    mockBuilder.select.mockReturnThis()
    mockBuilder.upsert.mockReturnThis()
    mockBuilder.update.mockReturnThis()
    mockBuilder.eq.mockReturnThis()
    mockBuilder.order.mockReturnThis()
    repo = new SupabaseMedicineRepository(USER_ID)
  })

  it('getAll: queries active medicines ordered by created_at', async () => {
    mockBuilder.order.mockResolvedValueOnce({ data: [dbRow], error: null })
    const result = await repo.getAll()
    const { supabase } = await import('@/lib/supabase')
    expect(supabase.from).toHaveBeenCalledWith('medicines')
    expect(mockBuilder.select).toHaveBeenCalled()
    expect(mockBuilder.eq).toHaveBeenCalledWith('active', true)
    expect(result).toHaveLength(1)
  })

  it('getAll: maps snake_case DB columns to camelCase TypeScript', async () => {
    mockBuilder.order.mockResolvedValueOnce({ data: [dbRow], error: null })
    const [med] = await repo.getAll()
    expect(med.mealRelation).toBe('before')
    expect(med.createdAt).toBe('2026-01-01T00:00:00.000Z')
    expect(med).toMatchObject(expected)
  })

  it('getAll: throws when Supabase returns an error', async () => {
    mockBuilder.order.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } })
    await expect(repo.getAll()).rejects.toEqual({ message: 'DB error' })
  })

  it('save: upserts with snake_case columns + user_id', async () => {
    mockBuilder.upsert.mockResolvedValueOnce({ data: null, error: null })
    const medicine: Medicine = {
      id: 'med-2',
      name: 'Ibuprofen',
      dosage: '200 mg',
      mealRelation: 'after',
      schedules: [{ time: 'noon', hour: 13, minute: 0 }],
      color: 'red',
      active: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    }
    await repo.save(medicine)
    const { supabase } = await import('@/lib/supabase')
    expect(supabase.from).toHaveBeenCalledWith('medicines')
    expect(mockBuilder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'med-2',
        user_id: USER_ID,
        meal_relation: 'after',
        created_at: '2026-01-01T00:00:00.000Z',
      }),
    )
  })

  it('delete: soft-deletes by setting active=false', async () => {
    mockBuilder.eq.mockResolvedValueOnce({ data: null, error: null })
    await repo.delete('med-1')
    const { supabase } = await import('@/lib/supabase')
    expect(supabase.from).toHaveBeenCalledWith('medicines')
    expect(mockBuilder.update).toHaveBeenCalledWith({ active: false })
    expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'med-1')
  })

  it('getById: returns undefined when not found', async () => {
    mockBuilder.maybeSingle.mockResolvedValueOnce({ data: null, error: null })
    const result = await repo.getById('nonexistent')
    expect(result).toBeUndefined()
  })
})
