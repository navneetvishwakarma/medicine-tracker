import type { Medicine } from '@medicine-tracker/core'
import type { IMedicineRepository } from '@medicine-tracker/core'
import { db } from './db'

type DbRow = {
  id: string
  name: string
  dosage: string
  meal_relation: string
  schedules: string
  color: string
  active: number
  notes: string | null
  created_at: string
}

function toMedicine(row: DbRow): Medicine {
  return {
    id: row.id,
    name: row.name,
    dosage: row.dosage,
    mealRelation: row.meal_relation as Medicine['mealRelation'],
    schedules: JSON.parse(row.schedules),
    color: row.color as Medicine['color'],
    active: row.active === 1,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  }
}

export class SqliteMedicineRepository implements IMedicineRepository {
  async getAll(): Promise<Medicine[]> {
    const rows = await db.getAllAsync<DbRow>('SELECT * FROM medicines WHERE active = 1')
    return rows.map(toMedicine)
  }

  async getById(id: string): Promise<Medicine | undefined> {
    const row = await db.getFirstAsync<DbRow>('SELECT * FROM medicines WHERE id = ?', [id])
    return row ? toMedicine(row) : undefined
  }

  async save(medicine: Medicine): Promise<void> {
    await db.runAsync(
      `INSERT OR REPLACE INTO medicines
         (id, name, dosage, meal_relation, schedules, color, active, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        medicine.id,
        medicine.name,
        medicine.dosage,
        medicine.mealRelation,
        JSON.stringify(medicine.schedules),
        medicine.color,
        medicine.active ? 1 : 0,
        medicine.notes ?? null,
        medicine.createdAt,
      ],
    )
  }

  async delete(id: string): Promise<void> {
    await db.runAsync('UPDATE medicines SET active = 0 WHERE id = ?', [id])
  }
}
