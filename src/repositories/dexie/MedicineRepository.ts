import type { Medicine } from '@/types'
import type { IMedicineRepository } from '../types'
import { db } from './db'

export class DexieMedicineRepository implements IMedicineRepository {
  async getAll(): Promise<Medicine[]> {
    const all = await db.medicines.toArray()
    return all.filter((m) => m.active)
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
