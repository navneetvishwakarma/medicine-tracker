import { describe, expect, it } from 'vitest'
import { computeDelayMs } from '@/services/notifications'

describe('computeDelayMs', () => {
  it('returns positive ms when target time is in the future', () => {
    const now = new Date('2026-05-18T07:00:00')
    const delay = computeDelayMs(8, 0, now)
    expect(delay).toBe(60 * 60 * 1000) // 1 hour in ms
  })

  it('returns null when target time is in the past', () => {
    const now = new Date('2026-05-18T09:00:00')
    const delay = computeDelayMs(8, 0, now)
    expect(delay).toBeNull()
  })

  it('returns positive ms for 30 minutes ahead', () => {
    const now = new Date('2026-05-18T07:30:00')
    const delay = computeDelayMs(8, 0, now)
    expect(delay).toBe(30 * 60 * 1000) // 30 min
  })

  it('returns null for same minute (0ms is not future)', () => {
    const now = new Date('2026-05-18T08:00:00')
    const delay = computeDelayMs(8, 0, now)
    expect(delay).toBeNull()
  })
})
