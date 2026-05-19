import type { AppSettings } from '@medicine-tracker/core'
import type { ISettingsRepository } from '@medicine-tracker/core'
import { DEFAULT_SETTINGS } from '@medicine-tracker/core'
import { db } from './db'

type DbRow = {
  id: number
  patient_name: string
  reminder_morning: string
  reminder_noon: string
  reminder_evening: string
  reminder_night: string
  notifications_enabled: number
}

function toSettings(row: DbRow): AppSettings {
  return {
    id: 1,
    patientName: row.patient_name,
    reminderTimes: {
      morning: row.reminder_morning,
      noon: row.reminder_noon,
      evening: row.reminder_evening,
      night: row.reminder_night,
    },
    notificationsEnabled: row.notifications_enabled === 1,
  }
}

export class SqliteSettingsRepository implements ISettingsRepository {
  async get(): Promise<AppSettings> {
    const row = await db.getFirstAsync<DbRow>('SELECT * FROM settings WHERE id = 1')
    return row ? toSettings(row) : DEFAULT_SETTINGS
  }

  async update(settings: Partial<Omit<AppSettings, 'id'>>): Promise<void> {
    const current = await this.get()
    const merged = {
      patientName: settings.patientName ?? current.patientName,
      reminderTimes: { ...current.reminderTimes, ...settings.reminderTimes },
      notificationsEnabled: settings.notificationsEnabled ?? current.notificationsEnabled,
    }
    await db.runAsync(
      `INSERT OR REPLACE INTO settings
         (id, patient_name, reminder_morning, reminder_noon, reminder_evening, reminder_night, notifications_enabled)
       VALUES (1, ?, ?, ?, ?, ?, ?)`,
      [
        merged.patientName,
        merged.reminderTimes.morning,
        merged.reminderTimes.noon,
        merged.reminderTimes.evening,
        merged.reminderTimes.night,
        merged.notificationsEnabled ? 1 : 0,
      ],
    )
  }
}
