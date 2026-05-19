import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Supabase mock ─────────────────────────────────────────────────────────────
const { mockUpsert, mockSupabase } = vi.hoisted(() => {
  const mockUpsert = vi.fn().mockResolvedValue({ error: null })
  const mockFrom = vi.fn().mockReturnValue({ upsert: mockUpsert })
  const mockSupabase = { from: mockFrom }
  return { mockUpsert, mockSupabase }
})

vi.mock('@/lib/supabase', () => ({ supabase: mockSupabase }))

// ── Web Push API mock ─────────────────────────────────────────────────────────
const mockSubscription = {
  endpoint: 'https://push.example.com/token123',
  getKey: vi.fn((name: string) => {
    if (name === 'p256dh') return new Uint8Array([1, 2, 3]).buffer
    if (name === 'auth') return new Uint8Array([4, 5]).buffer
    return null
  }),
}

const mockPushManager = {
  getSubscription: vi.fn().mockResolvedValue(null),
  subscribe: vi.fn().mockResolvedValue(mockSubscription),
}

Object.defineProperty(global, 'navigator', {
  value: { serviceWorker: { ready: Promise.resolve({ pushManager: mockPushManager }) } },
  configurable: true,
})

import { registerPushSubscription, isDue } from '@/services/notifications'

describe('isDue', () => {
  it('returns true when current time is within window of reminder', () => {
    const now = new Date('2026-05-18T08:03:00')
    expect(isDue('08:00', now, 7)).toBe(true)
  })

  it('returns false when current time is outside window', () => {
    const now = new Date('2026-05-18T08:10:00')
    expect(isDue('08:00', now, 7)).toBe(false)
  })

  it('returns false when before reminder time', () => {
    const now = new Date('2026-05-18T07:52:00')
    expect(isDue('08:00', now, 7)).toBe(false)
  })

  it('returns true at exact reminder time', () => {
    const now = new Date('2026-05-18T13:00:00')
    expect(isDue('13:00', now, 7)).toBe(true)
  })
})

describe('registerPushSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPushManager.getSubscription.mockResolvedValue(null)
    mockPushManager.subscribe.mockResolvedValue(mockSubscription)
    mockUpsert.mockResolvedValue({ error: null })
  })

  it('subscribes via pushManager with the VAPID public key', async () => {
    await registerPushSubscription('user-1')
    expect(mockPushManager.subscribe).toHaveBeenCalledWith({
      userVisibleOnly: true,
      applicationServerKey: expect.any(Uint8Array),
    })
  })

  it('upserts the subscription into push_subscriptions table', async () => {
    await registerPushSubscription('user-1')
    expect(mockSupabase.from).toHaveBeenCalledWith('push_subscriptions')
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        platform: 'web',
        endpoint: mockSubscription.endpoint,
      }),
      expect.any(Object),
    )
  })

  it('reuses an existing subscription instead of creating a new one', async () => {
    mockPushManager.getSubscription.mockResolvedValue(mockSubscription)
    await registerPushSubscription('user-1')
    expect(mockPushManager.subscribe).not.toHaveBeenCalled()
    expect(mockUpsert).toHaveBeenCalled()
  })

  it('throws when upsert fails', async () => {
    mockUpsert.mockResolvedValue({ error: new Error('DB error') })
    await expect(registerPushSubscription('user-1')).rejects.toThrow('DB error')
  })
})
