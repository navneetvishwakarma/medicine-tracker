import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DEFAULT_SETTINGS } from '@medicine-tracker/core'

const { mockBuilder } = vi.hoisted(() => {
  const mockBuilder = {
    select: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
  }
  return { mockBuilder }
})

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn().mockReturnValue(mockBuilder) },
}))

import { SupabaseSettingsRepository } from '@/repositories/supabase/SettingsRepository'

const USER_ID = 'user-123'

const dbRow = {
  user_id: USER_ID,
  patient_name: 'John',
  reminder_times: { morning: '08:00', noon: '13:00', evening: '18:00', night: '21:00' },
  notifications_enabled: true,
  migration_done: false,
}

describe('SupabaseSettingsRepository', () => {
  let repo: SupabaseSettingsRepository

  beforeEach(() => {
    vi.clearAllMocks()
    mockBuilder.select.mockReturnThis()
    mockBuilder.upsert.mockReturnThis()
    mockBuilder.eq.mockReturnThis()
    repo = new SupabaseSettingsRepository(USER_ID)
  })

  it('get: maps DB row to AppSettings with id: 1', async () => {
    mockBuilder.maybeSingle.mockResolvedValueOnce({ data: dbRow, error: null })
    const result = await repo.get()
    expect(result.id).toBe(1)
    expect(result.patientName).toBe('John')
    expect(result.notificationsEnabled).toBe(true)
    expect(result.reminderTimes.morning).toBe('08:00')
  })

  it('get: creates default settings when no row exists', async () => {
    mockBuilder.maybeSingle.mockResolvedValueOnce({ data: null, error: null })
    mockBuilder.upsert.mockResolvedValueOnce({ data: null, error: null })
    const result = await repo.get()
    expect(result).toMatchObject(DEFAULT_SETTINGS)
    const { supabase } = await import('@/lib/supabase')
    expect(supabase.from).toHaveBeenCalledWith('settings')
    expect(mockBuilder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: USER_ID }),
    )
  })

  it('get: throws when Supabase returns an error', async () => {
    mockBuilder.maybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'network error' } })
    await expect(repo.get()).rejects.toEqual({ message: 'network error' })
  })

  it('update: upserts partial settings merged with current', async () => {
    mockBuilder.maybeSingle.mockResolvedValueOnce({ data: dbRow, error: null })
    mockBuilder.upsert.mockResolvedValueOnce({ data: null, error: null })
    await repo.update({ patientName: 'Jane' })
    const { supabase } = await import('@/lib/supabase')
    expect(mockBuilder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: USER_ID,
        patient_name: 'Jane',
        notifications_enabled: true,
      }),
    )
  })
})
