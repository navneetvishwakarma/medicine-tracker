import type { Medicine } from '@/types'
import type { IMedicineRepository } from '../types'
import { db } from './db'

export class DexieMedicineRepository implements IMedicineRepository {
  async getAll(): Promise<Medicine[]> {
    return db.medicines.filter((m) => m.active).toArray()
  }

  async getById(id: string): Promise<Medicine | undefined> {
    return db.medicines.get(id)
  }

  async save(medicine: Medicine): Promise<void> {
    await db.medicines.put(medicine)
  }

  async delete(id: string): Promise<void> {
    await db.medicines.update(id, { active: false })
  }
}
