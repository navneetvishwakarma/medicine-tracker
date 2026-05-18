import type { AppSettings, Medicine } from '@/types'

type ScheduledNotification = { timeoutId: ReturnType<typeof setTimeout>; label: string }
const scheduled: ScheduledNotification[] = []

export function clearScheduled() {
  scheduled.forEach(({ timeoutId }) => clearTimeout(timeoutId))
  scheduled.length = 0
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  return Notification.requestPermission()
}

export function computeDelayMs(hour: number, minute: number, now: Date): number | null {
  const target = new Date(now)
  target.setHours(hour, minute, 0, 0)
  const diff = target.getTime() - now.getTime()
  return diff > 0 ? diff : null
}

export function scheduleToday(medicines: Medicine[], settings: AppSettings, now = new Date()) {
  clearScheduled()
  if (Notification.permission !== 'granted' || !settings.notificationsEnabled) return

  const slotEntries = Object.entries(settings.reminderTimes) as [
    keyof AppSettings['reminderTimes'],
    string,
  ][]

  for (const [slot, timeStr] of slotEntries) {
    const [hourStr, minStr] = timeStr.split(':')
    const hour = parseInt(hourStr, 10)
    const minute = parseInt(minStr, 10)

    const dueMedicines = medicines.filter((m) =>
      m.active && m.schedules.some((s) => s.time === slot),
    )
    if (dueMedicines.length === 0) continue

    const delay = computeDelayMs(hour, minute, now)
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

    scheduled.push({ timeoutId, label })
  }
}

export async function sendTestNotification() {
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
