import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { supabase } from '@/lib/supabase'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export async function registerExpoPushToken(userId: string): Promise<string | null> {
  if (!Device.isDevice) return null

  let { status } = await Notifications.getPermissionsAsync()
  if (status !== 'granted') {
    const result = await Notifications.requestPermissionsAsync()
    status = result.status
  }
  if (status !== 'granted') return null

  const { data: token } = await Notifications.getExpoPushTokenAsync()

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      { user_id: userId, platform: 'expo', expo_token: token },
      { onConflict: 'user_id,platform,expo_token' },
    )
  if (error) throw error

  return token
}
