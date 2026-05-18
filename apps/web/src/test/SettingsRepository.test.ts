import { beforeEach, describe, expect, it } from 'vitest'
import { DexieSettingsRepository } from '@/repositories/dexie/SettingsRepository'
import { db } from '@/repositories/dexie/db'
import { DEFAULT_SETTINGS } from '@/types'

describe('DexieSettingsRepository', () => {
  let repo: DexieSettingsRepository

  beforeEach(async () => {
    await db.settings.clear()
    repo = new DexieSettingsRepository()
  })

  it('creates default settings on first get', async () => {
    const settings = await repo.get()
    expect(settings.patientName).toBe('Patient')
    expect(settings.notificationsEnabled).toBe(false)
    expect(settings.reminderTimes.morning).toBe('08:00')
  })

  it('returns same defaults on subsequent gets without modifying', async () => {
    await repo.get()
    const second = await repo.get()
    expect(second.patientName).toBe(DEFAULT_SETTINGS.patientName)
  })

  it('updates patient name', async () => {
    await repo.get() // ensure defaults created
    await repo.update({ patientName: 'Alice' })
    const updated = await repo.get()
    expect(updated.patientName).toBe('Alice')
  })

  it('updates reminder time without affecting other fields', async () => {
    await repo.get()
    await repo.update({ reminderTimes: { morning: '09:00', noon: '13:00', evening: '18:00', night: '21:00' } })
    const updated = await repo.get()
    expect(updated.reminderTimes.morning).toBe('09:00')
    expect(updated.patientName).toBe('Patient') // unchanged
  })

  it('updates notificationsEnabled', async () => {
    await repo.get()
    await repo.update({ notificationsEnabled: true })
    const updated = await repo.get()
    expect(updated.notificationsEnabled).toBe(true)
  })
})
