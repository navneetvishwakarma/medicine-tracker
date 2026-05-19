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

import { SqliteDoseLogRepository } from '../src/repositories/sqlite/DoseLogRepository'

const sampleLog = {
  id: 'log-uuid-1',
  medicineId: 'med-uuid-1',
  scheduledDate: '2026-05-18',
  scheduledTime: 'morning' as const,
  status: 'taken' as const,
  markedAt: '2026-05-18T08:05:00.000Z',
  markedBy: 'Alice',
}

describe('SqliteDoseLogRepository', () => {
  let repo: SqliteDoseLogRepository

  beforeEach(() => {
    jest.clearAllMocks()
    repo = new SqliteDoseLogRepository()
  })

  it('getByDate returns empty array when no rows', async () => {
    mockDb.getAllAsync.mockResolvedValue([])
    const result = await repo.getByDate('2026-05-18')
    expect(result).toEqual([])
  })

  it('getByDate maps snake_case rows to DoseLog', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      {
        id: 'log-uuid-1',
        medicine_id: 'med-uuid-1',
        scheduled_date: '2026-05-18',
        scheduled_time: 'morning',
        status: 'taken',
        marked_at: '2026-05-18T08:05:00.000Z',
        marked_by: 'Alice',
        note: null,
      },
    ])
    const result = await repo.getByDate('2026-05-18')
    expect(result[0].medicineId).toBe('med-uuid-1')
    expect(result[0].markedBy).toBe('Alice')
    expect(result[0].status).toBe('taken')
  })

  it('getByRange passes correct date bounds', async () => {
    mockDb.getAllAsync.mockResolvedValue([])
    await repo.getByRange('2026-05-11', '2026-05-18')
    expect(mockDb.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('scheduled_date BETWEEN'),
      ['2026-05-11', '2026-05-18'],
    )
  })

  it('upsert inserts or replaces the log', async () => {
    await repo.upsert(sampleLog)
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR REPLACE'),
      expect.arrayContaining(['log-uuid-1', 'med-uuid-1', '2026-05-18']),
    )
  })
})
