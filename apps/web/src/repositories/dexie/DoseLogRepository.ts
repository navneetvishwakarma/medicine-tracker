import type { DoseLog } from '@/types'
import type { IDoseLogRepository } from '../types'
import { db } from './db'

export class DexieDoseLogRepository implements IDoseLogRepository {
  async getByDate(date: string): Promise<DoseLog[]> {
    return db.doseLogs.where('scheduledDate').equals(date).toArray()
  }

  async getByRange(from: string, to: string): Promise<DoseLog[]> {
    return db.doseLogs
      .where('scheduledDate')
      .between(from, to, true, true)
      .toArray()
  }

  async upsert(log: DoseLog): Promise<void> {
    await db.doseLogs.put(log)
  }

  // Not part of IDoseLogRepository interface — used only for cascade cleanup
  async deleteByMedicine(medicineId: string): Promise<void> {
    await db.doseLogs.where('medicineId').equals(medicineId).delete()
  }
}
