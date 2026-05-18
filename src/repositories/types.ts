import type { AppSettings, DoseLog, Medicine } from '@/types'

export interface IMedicineRepository {
  getAll(): Promise<Medicine[]>
  getById(id: string): Promise<Medicine | undefined>
  save(medicine: Medicine): Promise<void>
  delete(id: string): Promise<void>
}

export interface IDoseLogRepository {
  getByDate(date: string): Promise<DoseLog[]>
  getByRange(from: string, to: string): Promise<DoseLog[]>
  upsert(log: DoseLog): Promise<void>
  // deleteByMedicine intentionally omitted — internal utility, not a cross-cutting concern
}

export interface ISettingsRepository {
  get(): Promise<AppSettings>
  update(settings: Partial<Omit<AppSettings, 'id'>>): Promise<void>
}
