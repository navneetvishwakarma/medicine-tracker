import { DEFAULT_SETTINGS, type AppSettings } from '@/types'
import type { ISettingsRepository } from '../types'
import { db } from './db'

export class DexieSettingsRepository implements ISettingsRepository {
  async get(): Promise<AppSettings> {
    const existing = await db.settings.get(1)
    if (existing) return existing
    await db.settings.put(DEFAULT_SETTINGS)
    return DEFAULT_SETTINGS
  }

  async update(partial: Partial<Omit<AppSettings, 'id'>>): Promise<void> {
    const current = await this.get()
    await db.settings.put({ ...current, ...partial })
  }
}
