import { db } from '@/repositories/dexie/db'
import { SupabaseDoseLogRepository } from '@/repositories/supabase/DoseLogRepository'
import { SupabaseMedicineRepository } from '@/repositories/supabase/MedicineRepository'
import { SupabaseSettingsRepository } from '@/repositories/supabase/SettingsRepository'

export interface LocalDataSummary {
  medicines: number
  logs: number
}

export async function detectLocalData(): Promise<LocalDataSummary> {
  const [medicines, logs] = await Promise.all([
    db.medicines.count(),
    db.doseLogs.count(),
  ])
  return { medicines, logs }
}

export async function migrateToSupabase(userId: string): Promise<void> {
  const medicineRepo = new SupabaseMedicineRepository(userId)
  const doseLogRepo = new SupabaseDoseLogRepository(userId)
  const settingsRepo = new SupabaseSettingsRepository(userId)

  const [allMedicines, allLogs, localSettings] = await Promise.all([
    db.medicines.toArray(),
    db.doseLogs.toArray(),
    db.settings.get(1),
  ])

  // Migrate medicines
  for (const medicine of allMedicines) {
    await medicineRepo.save(medicine)
  }

  // Migrate dose logs in chunks of 100 to avoid payload limits
  const CHUNK_SIZE = 100
  for (let i = 0; i < allLogs.length; i += CHUNK_SIZE) {
    const chunk = allLogs.slice(i, i + CHUNK_SIZE)
    await Promise.all(chunk.map((log) => doseLogRepo.upsert(log)))
  }

  // Migrate settings if they exist
  if (localSettings) {
    await settingsRepo.update({
      patientName: localSettings.patientName,
      reminderTimes: localSettings.reminderTimes,
      notificationsEnabled: localSettings.notificationsEnabled,
    })
  }
}
