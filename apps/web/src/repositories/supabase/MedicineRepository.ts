import type { MealRelation, MedicineColor, MedicineSchedule, Medicine } from '@medicine-tracker/core'
import type { IMedicineRepository } from '@medicine-tracker/core'
import { supabase } from '@/lib/supabase'

type DbMedicine = {
  id: string
  user_id: string
  name: string
  dosage: string
  meal_relation: string
  schedules: MedicineSchedule[]
  color: string
  notes?: string | null
  active: boolean
  created_at: string
}

function toMedicine(row: DbMedicine): Medicine {
  return {
    id: row.id,
    name: row.name,
    dosage: row.dosage,
    mealRelation: row.meal_relation as MealRelation,
    schedules: row.schedules,
    color: row.color as MedicineColor,
    notes: row.notes ?? undefined,
    active: row.active,
    createdAt: row.created_at,
  }
}

function toDb(medicine: Medicine, userId: string): Omit<DbMedicine, 'notes'> & { notes?: string } {
  return {
    id: medicine.id,
    user_id: userId,
    name: medicine.name,
    dosage: medicine.dosage,
    meal_relation: medicine.mealRelation,
    schedules: medicine.schedules,
    color: medicine.color,
    notes: medicine.notes,
    active: medicine.active,
    created_at: medicine.createdAt,
  }
}

export class SupabaseMedicineRepository implements IMedicineRepository {
  constructor(private readonly userId: string) {}

  async getAll(): Promise<Medicine[]> {
    const { data, error } = await supabase
      .from('medicines')
      .select()
      .eq('active', true)
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []).map(toMedicine)
  }

  async getById(id: string): Promise<Medicine | undefined> {
    const { data, error } = await supabase
      .from('medicines')
      .select()
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data ? toMedicine(data as DbMedicine) : undefined
  }

  async save(medicine: Medicine): Promise<void> {
    const { error } = await supabase
      .from('medicines')
      .upsert(toDb(medicine, this.userId))
    if (error) throw error
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('medicines')
      .update({ active: false })
      .eq('id', id)
    if (error) throw error
  }
}
