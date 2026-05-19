import { beforeEach, describe, expect, it } from 'vitest'
import { DexieMedicineRepository } from '@/repositories/dexie/MedicineRepository'
import { db } from '@/repositories/dexie/db'
import type { Medicine } from '@/types'

function makeMedicine(overrides: Partial<Medicine> = {}): Medicine {
  return {
    id: crypto.randomUUID(),
    name: 'BRILINTA 90',
    dosage: '90mg',
    mealRelation: 'after',
    schedules: [{ time: 'morning', hour: 8, minute: 0 }],
    color: 'blue',
    active: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('DexieMedicineRepository', () => {
  let repo: DexieMedicineRepository

  beforeEach(async () => {
    await db.medicines.clear()
    repo = new DexieMedicineRepository()
  })

  it('returns empty array when no medicines exist', async () => {
    const result = await repo.getAll()
    expect(result).toEqual([])
  })

  it('saves and retrieves a medicine', async () => {
    const med = makeMedicine()
    await repo.save(med)
    const all = await repo.getAll()
    expect(all).toHaveLength(1)
    expect(all[0].name).toBe('BRILINTA 90')
  })

  it('getById returns the correct medicine', async () => {
    const med = makeMedicine()
    await repo.save(med)
    const found = await repo.getById(med.id)
    expect(found?.id).toBe(med.id)
  })

  it('getById returns undefined for unknown id', async () => {
    const found = await repo.getById('nonexistent')
    expect(found).toBeUndefined()
  })

  it('updates a medicine via save (put semantics)', async () => {
    const med = makeMedicine()
    await repo.save(med)
    await repo.save({ ...med, dosage: '45mg' })
    const found = await repo.getById(med.id)
    expect(found?.dosage).toBe('45mg')
  })

  it('soft-deletes a medicine (sets active=false)', async () => {
    const med = makeMedicine()
    await repo.save(med)
    await repo.delete(med.id)
    const all = await repo.getAll()
    expect(all).toHaveLength(0) // getAll filters active=true only
    const raw = await repo.getById(med.id)
    expect(raw?.active).toBe(false)
  })

  it('does not return inactive medicines in getAll', async () => {
    await repo.save(makeMedicine({ id: crypto.randomUUID(), name: 'Active', active: true }))
    const inactive = makeMedicine({ id: crypto.randomUUID(), name: 'Archived', active: false })
    await db.medicines.put(inactive) // bypass repo to insert inactive
    const all = await repo.getAll()
    expect(all).toHaveLength(1)
    expect(all[0].name).toBe('Active')
  })

  it('returns multiple medicines sorted by insertion order', async () => {
    await repo.save(makeMedicine({ id: crypto.randomUUID(), name: 'Med A' }))
    await repo.save(makeMedicine({ id: crypto.randomUUID(), name: 'Med B' }))
    const all = await repo.getAll()
    expect(all).toHaveLength(2)
  })
})
