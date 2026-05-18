import Dexie, { type EntityTable } from 'dexie'
import type { AppSettings, DoseLog, Medicine } from '@/types'

class MedicineTrackerDB extends Dexie {
  medicines!: EntityTable<Medicine, 'id'>
  doseLogs!: EntityTable<DoseLog, 'id'>
  settings!: EntityTable<AppSettings, 'id'>

  constructor() {
    super('MedicineTrackerDB')
    this.version(1).stores({
      medicines: '&id, active',
      doseLogs: '&id, [medicineId+scheduledDate], scheduledDate',
      settings: '&id',
    })
    // v2: add standalone medicineId index so deleteByMedicine uses an index, not a full scan
    this.version(2).stores({
      medicines: '&id, active',
      doseLogs: '&id, medicineId, [medicineId+scheduledDate], scheduledDate',
      settings: '&id',
    })
  }
}

export const db = new MedicineTrackerDB()
