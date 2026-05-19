// ── expo-sqlite mock ──────────────────────────────────────────────────────────
const mockDb = {
  execAsync: jest.fn().mockResolvedValue(undefined),
  runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
  getAllAsync: jest.fn<() => Promise<unknown[]>>().mockResolvedValue([]),
  getFirstAsync: jest.fn<() => Promise<unknown>>().mockResolvedValue(null),
}

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => mockDb),
}))

import { SqliteMedicineRepository } from '../src/repositories/sqlite/MedicineRepository'

const sampleMedicine = {
  id: 'med-uuid-1',
  name: 'Aspirin',
  dosage: '100mg',
  mealRelation: 'after' as const,
  schedules: [{ time: 'morning' as const, hour: 8, minute: 0 }],
  color: 'blue' as const,
  active: true,
  createdAt: '2026-05-18T00:00:00.000Z',
}

describe('SqliteMedicineRepository', () => {
  let repo: SqliteMedicineRepository

  beforeEach(() => {
    jest.clearAllMocks()
    repo = new SqliteMedicineRepository()
  })

  it('getAll returns empty array when no rows', async () => {
    mockDb.getAllAsync.mockResolvedValue([])
    const result = await repo.getAll()
    expect(result).toEqual([])
  })

  it('getAll maps DB rows to Medicine objects', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      {
        id: 'med-uuid-1',
        name: 'Aspirin',
        dosage: '100mg',
        meal_relation: 'after',
        schedules: JSON.stringify([{ time: 'morning', hour: 8, minute: 0 }]),
        color: 'blue',
        active: 1,
        notes: null,
        created_at: '2026-05-18T00:00:00.000Z',
      },
    ])
    const result = await repo.getAll()
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Aspirin')
    expect(result[0].mealRelation).toBe('after')
    expect(result[0].active).toBe(true)
  })

  it('save inserts a new medicine', async () => {
    await repo.save(sampleMedicine)
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR REPLACE'),
      expect.arrayContaining(['med-uuid-1', 'Aspirin']),
    )
  })

  it('delete sets active to 0 (soft delete)', async () => {
    await repo.delete('med-uuid-1')
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('active = 0'),
      ['med-uuid-1'],
    )
  })

  it('getById returns undefined when not found', async () => {
    mockDb.getFirstAsync.mockResolvedValue(null)
    const result = await repo.getById('nonexistent')
    expect(result).toBeUndefined()
  })
})
