import { beforeEach, describe, expect, it } from 'vitest'
import { DexieDoseLogRepository } from '@/repositories/dexie/DoseLogRepository'
import { db } from '@/repositories/dexie/db'
import type { DoseLog } from '@/types'

function makeLog(overrides: Partial<DoseLog> = {}): DoseLog {
  return {
    id: crypto.randomUUID(),
    medicineId: 'med-1',
    scheduledDate: '2026-05-18',
    scheduledTime: 'morning',
    status: 'pending',
    ...overrides,
  }
}

describe('DexieDoseLogRepository', () => {
  let repo: DexieDoseLogRepository

  beforeEach(async () => {
    await db.doseLogs.clear()
    repo = new DexieDoseLogRepository()
  })

  it('getByDate returns logs for the given date', async () => {
    await repo.upsert(makeLog({ scheduledDate: '2026-05-18' }))
    await repo.upsert(makeLog({ scheduledDate: '2026-05-17' }))
    const result = await repo.getByDate('2026-05-18')
    expect(result).toHaveLength(1)
    expect(result[0].scheduledDate).toBe('2026-05-18')
  })

  it('getByRange returns logs within the inclusive date range', async () => {
    await repo.upsert(makeLog({ scheduledDate: '2026-05-16' }))
    await repo.upsert(makeLog({ scheduledDate: '2026-05-17' }))
    await repo.upsert(makeLog({ scheduledDate: '2026-05-18' }))
    await repo.upsert(makeLog({ scheduledDate: '2026-05-19' }))
    const result = await repo.getByRange('2026-05-17', '2026-05-18')
    expect(result).toHaveLength(2)
  })

  it('upsert inserts a new log', async () => {
    const log = makeLog()
    await repo.upsert(log)
    const result = await repo.getByDate('2026-05-18')
    expect(result[0].id).toBe(log.id)
  })

  it('upsert updates an existing log (same id)', async () => {
    const log = makeLog()
    await repo.upsert(log)
    await repo.upsert({ ...log, status: 'taken', markedAt: new Date().toISOString() })
    const result = await repo.getByDate('2026-05-18')
    expect(result).toHaveLength(1)
    expect(result[0].status).toBe('taken')
  })

  it('deleteByMedicine removes all logs for the given medicine', async () => {
    await repo.upsert(makeLog({ medicineId: 'med-1' }))
    await repo.upsert(makeLog({ medicineId: 'med-1', scheduledDate: '2026-05-17' }))
    await repo.upsert(makeLog({ id: crypto.randomUUID(), medicineId: 'med-2' }))
    await repo.deleteByMedicine('med-1')
    const remaining = await repo.getByDate('2026-05-18')
    expect(remaining).toHaveLength(1)
    expect(remaining[0].medicineId).toBe('med-2')
  })
})
