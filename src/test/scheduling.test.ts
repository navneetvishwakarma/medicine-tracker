import { describe, expect, it } from 'vitest'
import { getDailySlots, getMissedDoses } from '@/domain/scheduling'
import type { DoseLog, Medicine } from '@/types'

function makeMedicine(overrides: Partial<Medicine> = {}): Medicine {
  return {
    id: 'med-1',
    name: 'Aspirin',
    dosage: '75mg',
    mealRelation: 'after',
    schedules: [
      { time: 'morning', hour: 8, minute: 0 },
      { time: 'evening', hour: 18, minute: 0 },
    ],
    color: 'blue',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

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

describe('getDailySlots', () => {
  it('returns one slot per schedule for an active medicine', () => {
    const slots = getDailySlots([makeMedicine()], '2026-05-18', [])
    expect(slots).toHaveLength(2)
    expect(slots.map((s) => s.scheduledTime)).toEqual(['morning', 'evening'])
  })

  it('returns empty array when no active medicines', () => {
    const slots = getDailySlots([], '2026-05-18', [])
    expect(slots).toHaveLength(0)
  })

  it('attaches existing log to the correct slot', () => {
    const log = makeLog({ scheduledTime: 'morning', status: 'taken' })
    const slots = getDailySlots([makeMedicine()], '2026-05-18', [log])
    const morning = slots.find((s) => s.scheduledTime === 'morning')
    expect(morning?.log?.status).toBe('taken')
  })

  it('sets log to null when no log exists for a slot', () => {
    const slots = getDailySlots([makeMedicine()], '2026-05-18', [])
    expect(slots.every((s) => s.log === null)).toBe(true)
  })

  it('handles multiple medicines', () => {
    const med2 = makeMedicine({ id: 'med-2', name: 'Metformin', schedules: [{ time: 'noon', hour: 13, minute: 0 }] })
    const slots = getDailySlots([makeMedicine(), med2], '2026-05-18', [])
    expect(slots).toHaveLength(3) // 2 from med-1 + 1 from med-2
  })

  it('only returns slots for the given date log', () => {
    const wrongDateLog = makeLog({ scheduledDate: '2026-05-17', scheduledTime: 'morning', status: 'taken' })
    const slots = getDailySlots([makeMedicine()], '2026-05-18', [wrongDateLog])
    const morning = slots.find((s) => s.scheduledTime === 'morning')
    expect(morning?.log).toBeNull()
  })
})

describe('getMissedDoses', () => {
  it('returns pending logs from before today', () => {
    const yesterday = makeLog({ scheduledDate: '2026-05-17', status: 'pending' })
    const missed = getMissedDoses([yesterday], new Date('2026-05-18'))
    expect(missed).toHaveLength(1)
  })

  it('does not return todays pending doses as missed', () => {
    const today = makeLog({ scheduledDate: '2026-05-18', status: 'pending' })
    const missed = getMissedDoses([today], new Date('2026-05-18'))
    expect(missed).toHaveLength(0)
  })

  it('does not return taken or skipped doses as missed', () => {
    const taken = makeLog({ scheduledDate: '2026-05-17', status: 'taken' })
    const skipped = makeLog({ scheduledDate: '2026-05-17', status: 'skipped' })
    const missed = getMissedDoses([taken, skipped], new Date('2026-05-18'))
    expect(missed).toHaveLength(0)
  })

  it('returns empty array when no logs', () => {
    const missed = getMissedDoses([], new Date('2026-05-18'))
    expect(missed).toHaveLength(0)
  })
})
