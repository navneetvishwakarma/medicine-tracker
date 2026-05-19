import { describe, expect, it } from 'vitest'
import { buildGridData } from '@/domain/export'
import type { DoseLog, Medicine } from '@/types'

function makeMed(id = 'med-1', name = 'Aspirin'): Medicine {
  return {
    id, name, dosage: '75mg', mealRelation: 'after',
    schedules: [{ time: 'morning', hour: 8, minute: 0 }],
    color: 'blue', active: true, createdAt: '2026-01-01T00:00:00.000Z',
  }
}

function makeLog(overrides: Partial<DoseLog> = {}): DoseLog {
  return {
    id: crypto.randomUUID(), medicineId: 'med-1',
    scheduledDate: '2026-05-18', scheduledTime: 'morning', status: 'pending',
    ...overrides,
  }
}

describe('buildGridData', () => {
  it('returns a row per medicine', () => {
    const rows = buildGridData([makeMed()], [], { from: '2026-05-18', to: '2026-05-18' })
    expect(rows).toHaveLength(1)
    expect(rows[0].medicineName).toBe('Aspirin')
  })

  it('generates a cell for each date in range', () => {
    const rows = buildGridData([makeMed()], [], { from: '2026-05-18', to: '2026-05-20' })
    expect(Object.keys(rows[0].cells)).toEqual(['2026-05-18', '2026-05-19', '2026-05-20'])
  })

  it('marks taken dose as T', () => {
    const log = makeLog({ status: 'taken' })
    const rows = buildGridData([makeMed()], [log], { from: '2026-05-18', to: '2026-05-18' })
    expect(rows[0].cells['2026-05-18']).toBe('T')
  })

  it('marks skipped dose as S', () => {
    const log = makeLog({ status: 'skipped' })
    const rows = buildGridData([makeMed()], [log], { from: '2026-05-18', to: '2026-05-18' })
    expect(rows[0].cells['2026-05-18']).toBe('S')
  })

  it('marks no-log date as –', () => {
    const rows = buildGridData([makeMed()], [], { from: '2026-05-18', to: '2026-05-18' })
    expect(rows[0].cells['2026-05-18']).toBe('–')
  })

  it('taken overrides skipped for same medicine+date', () => {
    const logs = [
      makeLog({ status: 'skipped' }),
      makeLog({ id: crypto.randomUUID(), status: 'taken' }),
    ]
    const rows = buildGridData([makeMed()], logs, { from: '2026-05-18', to: '2026-05-18' })
    expect(rows[0].cells['2026-05-18']).toBe('T')
  })

  it('handles a single-day range', () => {
    const rows = buildGridData([makeMed()], [], { from: '2026-05-18', to: '2026-05-18' })
    expect(Object.keys(rows[0].cells)).toHaveLength(1)
  })
})
