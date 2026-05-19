import type { AppSettings, Medicine } from '@/types'
import { supabase } from '@/lib/supabase'

// ── Pure helpers ──────────────────────────────────────────────────────────────

/** Returns true when `now` is within `windowMin` minutes after the reminder time. */
export function isDue(reminderTime: string, now: Date, windowMin: number): boolean {
  const [hStr, mStr] = reminderTime.split(':')
  const slotMins = parseInt(hStr, 10) * 60 + parseInt(mStr, 10)
  const nowMins = now.getHours() * 60 + now.getMinutes()
  return nowMins >= slotMins && nowMins < slotMins + windowMin
}

/** Converts a base64url string to a Uint8Array (for applicationServerKey). */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

/** Converts an ArrayBuffer to a base64 string. */
function bufferToBase64(buf: ArrayBuffer | null): string {
  if (!buf) return ''
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

// ── Push subscription registration ───────────────────────────────────────────

export async function registerPushSubscription(userId: string): Promise<void> {
  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()

  if (!sub) {
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? ''
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    })
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id: userId,
        platform: 'web',
        endpoint: sub.endpoint,
        p256dh: bufferToBase64(sub.getKey('p256dh')),
        auth_key: bufferToBase64(sub.getKey('auth')),
      },
      { onConflict: 'user_id,platform,endpoint' },
    )

  if (error) throw error
}

// ── setTimeout-based scheduler (offline / dev fallback) ──────────────────────

type ScheduledNotification = { timeoutId: ReturnType<typeof setTimeout>; label: string }

class NotificationService {
  private scheduled: ScheduledNotification[] = []

  clearScheduled(): void {
    this.scheduled.forEach(({ timeoutId }) => clearTimeout(timeoutId))
    this.scheduled.length = 0
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) return 'denied'
    if (Notification.permission === 'granted') return 'granted'
    return Notification.requestPermission()
  }

  computeDelayMs(hour: number, minute: number, now: Date): number | null {
    const target = new Date(now)
    target.setHours(hour, minute, 0, 0)
    const diff = target.getTime() - now.getTime()
    return diff > 0 ? diff : null
  }

  scheduleToday(medicines: Medicine[], settings: AppSettings, now = new Date()): void {
    this.clearScheduled()
    if (Notification.permission !== 'granted' || !settings.notificationsEnabled) return

    const slotEntries = Object.entries(settings.reminderTimes) as [
      keyof AppSettings['reminderTimes'],
      string,
    ][]

    for (const [slot, timeStr] of slotEntries) {
      const [hourStr, minStr] = timeStr.split(':')
      const hour = parseInt(hourStr, 10)
      const minute = parseInt(minStr, 10)

      const dueMedicines = medicines.filter(
        (m) => m.active && m.schedules.some((s) => s.time === slot),
      )
      if (dueMedicines.length === 0) continue

      const delay = this.computeDelayMs(hour, minute, now)
      if (delay === null) continue

      const body = dueMedicines.map((m) => `${m.name} ${m.dosage}`).join(', ')
      const label = `${slot} reminder`

      const timeoutId = setTimeout(async () => {
        const reg = await navigator.serviceWorker?.ready
        if (reg) {
          reg.showNotification('Medicine Reminder', {
            body,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            tag: `reminder-${slot}`,
          })
        } else {
          new Notification('Medicine Reminder', { body })
        }
      }, delay)

      this.scheduled.push({ timeoutId, label })
    }
  }

  async sendTestNotification(): Promise<void> {
    if (Notification.permission !== 'granted') return
    const reg = await navigator.serviceWorker?.ready.catch(() => null)
    const body = 'Medicine Reminder is working!'
    if (reg) {
      reg.showNotification('Test Notification', {
        body,
        icon: '/icons/icon-192.png',
        tag: 'test',
      })
    } else {
      new Notification('Test Notification', { body })
    }
  }
}

const _service = new NotificationService()

export const clearScheduled = _service.clearScheduled.bind(_service)
export const requestPermission = _service.requestPermission.bind(_service)
export const computeDelayMs = _service.computeDelayMs.bind(_service)
export const scheduleToday = _service.scheduleToday.bind(_service)
export const sendTestNotification = _service.sendTestNotification.bind(_service)
