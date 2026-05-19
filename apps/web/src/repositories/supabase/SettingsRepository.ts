import type { AppSettings } from '@medicine-tracker/core'
import { DEFAULT_SETTINGS } from '@medicine-tracker/core'
import type { ISettingsRepository } from '@medicine-tracker/core'
import { supabase } from '@/lib/supabase'

type DbSettings = {
  user_id: string
  patient_name: string
  reminder_times: AppSettings['reminderTimes']
  notifications_enabled: boolean
  migration_done: boolean
}

function toSettings(row: DbSettings): AppSettings {
  return {
    id: 1,
    patientName: row.patient_name,
    reminderTimes: row.reminder_times,
    notificationsEnabled: row.notifications_enabled,
  }
}

function toDb(settings: AppSettings, userId: string): DbSettings {
  return {
    user_id: userId,
    patient_name: settings.patientName,
    reminder_times: settings.reminderTimes,
    notifications_enabled: settings.notificationsEnabled,
    migration_done: false,
  }
}

export class SupabaseSettingsRepository implements ISettingsRepository {
  constructor(private readonly userId: string) {}

  async get(): Promise<AppSettings> {
    const { data, error } = await supabase
      .from('settings')
      .select()
      .eq('user_id', this.userId)
      .maybeSingle()
    if (error) throw error
    if (data) return toSettings(data as DbSettings)

    // First sign-in: create default row
    const defaults: DbSettings = {
      user_id: this.userId,
      patient_name: DEFAULT_SETTINGS.patientName,
      reminder_times: DEFAULT_SETTINGS.reminderTimes,
      notifications_enabled: DEFAULT_SETTINGS.notificationsEnabled,
      migration_done: false,
    }
    const { error: insertError } = await supabase.from('settings').upsert(defaults)
    if (insertError) throw insertError
    return DEFAULT_SETTINGS
  }

  async update(partial: Partial<Omit<AppSettings, 'id'>>): Promise<void> {
    const current = await this.get()
    const merged: AppSettings = { ...current, ...partial }
    const { error } = await supabase
      .from('settings')
      .upsert(toDb(merged, this.userId))
    if (error) throw error
  }
}
