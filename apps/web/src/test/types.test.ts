import { describe, expect, it } from 'vitest'
import { AppSettingsSchema, DEFAULT_SETTINGS, DoseLogSchema, MedicineSchema } from '@/types'

describe('Zod schemas', () => {
  it('validates a valid Medicine', () => {
    const result = MedicineSchema.safeParse({
      id: crypto.randomUUID(),
      name: 'BRILINTA 90',
      dosage: '90mg',
      mealRelation: 'after',
      schedules: [{ time: 'morning', hour: 8, minute: 0 }],
      color: 'blue',
      active: true,
      createdAt: new Date().toISOString(),
    })
    expect(result.success).toBe(true)
  })

  it('rejects Medicine with empty name', () => {
    const result = MedicineSchema.safeParse({
      id: crypto.randomUUID(),
      name: '',
      dosage: '90mg',
      mealRelation: 'after',
      schedules: [{ time: 'morning', hour: 8, minute: 0 }],
      color: 'blue',
      active: true,
      createdAt: new Date().toISOString(),
    })
    expect(result.success).toBe(false)
  })

  it('rejects Medicine with no schedules', () => {
    const result = MedicineSchema.safeParse({
      id: crypto.randomUUID(),
      name: 'Test',
      dosage: '10mg',
      mealRelation: 'none',
      schedules: [],
      color: 'green',
      active: true,
      createdAt: new Date().toISOString(),
    })
    expect(result.success).toBe(false)
  })

  it('validates a valid DoseLog', () => {
    const result = DoseLogSchema.safeParse({
      id: crypto.randomUUID(),
      medicineId: crypto.randomUUID(),
      scheduledDate: '2026-05-18',
      scheduledTime: 'morning',
      status: 'pending',
    })
    expect(result.success).toBe(true)
  })

  it('validates DEFAULT_SETTINGS', () => {
    const result = AppSettingsSchema.safeParse(DEFAULT_SETTINGS)
    expect(result.success).toBe(true)
  })
})
