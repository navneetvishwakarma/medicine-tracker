import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useSettings, useUpdateSettings } from '@/hooks/useSettings'
import { TIME_SLOTS } from '@/types'
import { useUIStore } from '@/store/useUIStore'

const TIME_RE = /^\d{2}:\d{2}$/

const SettingsFormSchema = z.object({
  patientName: z.string().min(1, 'Name is required').max(100),
  reminderTimes: z.object({
    morning: z.string().regex(TIME_RE),
    noon: z.string().regex(TIME_RE),
    evening: z.string().regex(TIME_RE),
    night: z.string().regex(TIME_RE),
  }),
  notificationsEnabled: z.boolean(),
})

type SettingsFormValues = z.infer<typeof SettingsFormSchema>

const SLOT_LABELS: Record<string, string> = {
  morning: 'Morning',
  noon: 'Noon',
  evening: 'Evening',
  night: 'Night',
}

export default function Settings() {
  const { data: settings } = useSettings()
  const update = useUpdateSettings()
  const { addToast } = useUIStore()

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<SettingsFormValues>({
    resolver: zodResolver(SettingsFormSchema),
    defaultValues: {
      patientName: 'Patient',
      reminderTimes: { morning: '08:00', noon: '13:00', evening: '18:00', night: '21:00' },
      notificationsEnabled: false,
    },
  })

  // Sync loaded settings into form
  useEffect(() => {
    if (settings) {
      reset({
        patientName: settings.patientName,
        reminderTimes: settings.reminderTimes,
        notificationsEnabled: settings.notificationsEnabled,
      })
    }
  }, [settings, reset])

  const onSubmit = (values: SettingsFormValues) => {
    update.mutate(values, {
      onSuccess: () => addToast('Settings saved', 'success'),
    })
  }

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      addToast('Notifications not supported on this device', 'error')
      return
    }
    const result = await Notification.requestPermission()
    if (result === 'granted') {
      update.mutate({ notificationsEnabled: true })
      addToast('Notifications enabled', 'success')
    } else {
      addToast('Permission denied — enable notifications in browser settings', 'error')
    }
  }

  return (
    <main className="p-4 pb-8">
      <h1 className="text-xl font-semibold mb-4">Settings</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Patient name */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Profile</h2>
          <div className="bg-white rounded-xl border p-4 space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Your name</label>
              <input
                {...register('patientName')}
                placeholder="Patient"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.patientName && (
                <p className="text-red-500 text-xs mt-1">{errors.patientName.message}</p>
              )}
            </div>
          </div>
        </section>

        {/* Reminder times */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Reminder times</h2>
          <div className="bg-white rounded-xl border divide-y">
            {TIME_SLOTS.map((slot) => (
              <div key={slot} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium">{SLOT_LABELS[slot]}</span>
                <input
                  type="time"
                  {...register(`reminderTimes.${slot}` as const)}
                  className="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Notifications */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Notifications</h2>
          <div className="bg-white rounded-xl border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Dose reminders</p>
                <p className="text-xs text-gray-500">Requires app opened at least once daily</p>
              </div>
              <input
                type="checkbox"
                {...register('notificationsEnabled')}
                onClick={requestNotificationPermission}
                className="w-5 h-5 accent-blue-600 cursor-pointer"
              />
            </div>
            <button
              type="button"
              onClick={async () => {
                if (Notification.permission !== 'granted') return
                new Notification('Medicine Reminder', { body: 'Test notification — this is working!', icon: '/icons/icon-192.png' })
              }}
              className="w-full py-2 text-sm border rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Send test notification
            </button>
          </div>
        </section>

        {/* Save */}
        <button
          type="submit"
          disabled={!isDirty || update.isPending}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {update.isPending ? 'Saving…' : 'Save settings'}
        </button>
      </form>
    </main>
  )
}
