// ── expo-notifications mock ───────────────────────────────────────────────────
const mockGetPermissions = jest.fn().mockResolvedValue({ status: 'undetermined' })
const mockRequestPermissions = jest.fn().mockResolvedValue({ status: 'granted' })
const mockGetExpoPushToken = jest.fn().mockResolvedValue({ data: 'ExponentPushToken[test123]' })

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: mockGetPermissions,
  requestPermissionsAsync: mockRequestPermissions,
  getExpoPushTokenAsync: mockGetExpoPushToken,
  setNotificationHandler: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
}))

// ── expo-device mock ─────────────────────────────────────────────────────────
jest.mock('expo-device', () => ({ isDevice: true }))

// ── Supabase mock ─────────────────────────────────────────────────────────────
const mockUpsert = jest.fn().mockResolvedValue({ error: null })
const mockFrom = jest.fn().mockReturnValue({ upsert: mockUpsert })

jest.mock('../src/lib/supabase', () => ({
  supabase: { from: mockFrom },
}))

import { registerExpoPushToken } from '../src/services/pushNotifications'

describe('registerExpoPushToken', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetPermissions.mockResolvedValue({ status: 'undetermined' })
    mockRequestPermissions.mockResolvedValue({ status: 'granted' })
    mockGetExpoPushToken.mockResolvedValue({ data: 'ExponentPushToken[test123]' })
    mockUpsert.mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ upsert: mockUpsert })
  })

  it('requests permission when not yet granted', async () => {
    await registerExpoPushToken('user-1')
    expect(mockRequestPermissions).toHaveBeenCalled()
  })

  it('skips requesting if already granted', async () => {
    mockGetPermissions.mockResolvedValue({ status: 'granted' })
    await registerExpoPushToken('user-1')
    expect(mockRequestPermissions).not.toHaveBeenCalled()
  })

  it('upserts Expo push token to push_subscriptions with platform expo', async () => {
    await registerExpoPushToken('user-1')
    expect(mockFrom).toHaveBeenCalledWith('push_subscriptions')
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        platform: 'expo',
        expo_token: 'ExponentPushToken[test123]',
      }),
      expect.any(Object),
    )
  })

  it('returns null and does not upsert when permission is denied', async () => {
    mockGetPermissions.mockResolvedValue({ status: 'undetermined' })
    mockRequestPermissions.mockResolvedValue({ status: 'denied' })
    const result = await registerExpoPushToken('user-1')
    expect(result).toBeNull()
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it('throws when upsert fails', async () => {
    mockUpsert.mockResolvedValue({ error: new Error('DB error') })
    await expect(registerExpoPushToken('user-1')).rejects.toThrow('DB error')
  })
})
