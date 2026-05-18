// Supabase Edge Function — runs every 15 minutes via pg_cron / scheduled invocation
// Finds slots due ±7 min and sends Web Push notifications to subscribed users.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'

const WINDOW_MIN = 7

function isDue(reminderTime: string, now: Date): boolean {
  const [hStr, mStr] = reminderTime.split(':')
  const slotMins = parseInt(hStr, 10) * 60 + parseInt(mStr, 10)
  const nowMins = now.getHours() * 60 + now.getMinutes()
  return nowMins >= slotMins && nowMins < slotMins + WINDOW_MIN
}

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!
  const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@medicine-tracker.app'

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

  const db = createClient(supabaseUrl, serviceRoleKey)
  const now = new Date()

  // Fetch all users with notifications enabled
  const { data: settingsRows, error: settingsErr } = await db
    .from('settings')
    .select('user_id, reminder_times')
    .eq('notifications_enabled', true)

  if (settingsErr) {
    console.error('Failed to fetch settings:', settingsErr)
    return new Response('Error fetching settings', { status: 500 })
  }

  let sent = 0

  for (const row of settingsRows ?? []) {
    const reminderTimes: Record<string, string> = row.reminder_times

    // Find which slots are due right now
    const dueSlots = Object.entries(reminderTimes)
      .filter(([, time]) => isDue(time, now))
      .map(([slot]) => slot)

    if (dueSlots.length === 0) continue

    // Fetch active medicines for those slots
    const { data: medicines } = await db
      .from('medicines')
      .select('name, dosage, schedules')
      .eq('user_id', row.user_id)
      .eq('active', true)

    const dueMeds = (medicines ?? []).filter((m) =>
      m.schedules?.some((s: { time: string }) => dueSlots.includes(s.time)),
    )
    if (dueMeds.length === 0) continue

    const body = dueMeds.map((m: { name: string; dosage: string }) => `${m.name} ${m.dosage}`).join(', ')
    const tag = `reminder-${dueSlots.join('-')}`

    // Fetch all web push subscriptions for this user
    const { data: subs } = await db
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth_key')
      .eq('user_id', row.user_id)
      .eq('platform', 'web')

    for (const sub of subs ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
          JSON.stringify({ title: 'Medicine Reminder', body, tag }),
        )
        sent++
      } catch (err) {
        console.error('Push send failed for endpoint', sub.endpoint, err)
      }
    }
  }

  return new Response(JSON.stringify({ sent, ts: now.toISOString() }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
