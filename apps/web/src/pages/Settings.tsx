import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useSettings, useUpdateSettings } from '@/hooks/useSettings'
import { registerPushSubscription, sendTestNotification } from '@/services/notifications'
import { TIME_SLOTS } from '@/types'
import { useUIStore } from '@/store/useUIStore'
import { useAuth } from '@/context/AuthContext'

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
  const { user } = useAuth()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(SettingsFormSchema),
    defaultValues: {
      patientName: 'Patient',
      reminderTimes: { morning: '08:00', noon: '13:00', evening: '18:00', night: '21:00' },
      notificationsEnabled: false,
    },
  })

  const notificationsEnabled = watch('notificationsEnabled')

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

  const handleNotificationToggle = async (checked: boolean) => {
    if (checked) {
      if (!('Notification' in window)) {
        addToast('Notifications not supported on this device', 'error')
        return
      }
      const result = await Notification.requestPermission()
      if (result === 'granted') {
        setValue('notificationsEnabled', true, { shouldDirty: true })
        addToast('Notifications enabled', 'success')
        if (user?.id && 'serviceWorker' in navigator) {
          registerPushSubscription(user.id).catch(() => {
            // push subscription is best-effort; silent failure is acceptable
          })
        }
      } else {
        addToast('Permission denied — enable notifications in browser settings', 'error')
      }
    } else {
      setValue('notificationsEnabled', false, { shouldDirty: true })
    }
  }

  const SectionHeader = ({ children }: { children: React.ReactNode }) => (
    <p
      className="font-bold text-gray-400 uppercase tracking-widest px-1 mb-2"
      style={{ fontSize: 11 }}
    >
      {children}
    </p>
  )

  return (
    <main className="p-4 pb-10">
      <h1 className="font-bold text-gray-900 mb-6" style={{ fontSize: 24 }}>
        Settings
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
        {/* Profile */}
        <section>
          <SectionHeader>Profile</SectionHeader>
          <div
            className="bg-white rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 1px 2px rgba(28,28,26,0.06)' }}
          >
            <div className="px-4 py-3.5">
              <label className="block font-medium text-gray-700 mb-2" style={{ fontSize: 14 }}>
                Your name
              </label>
              <input
                {...register('patientName')}
                placeholder="Patient"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                style={{ fontSize: 15 }}
              />
              {errors.patientName && (
                <p className="text-red-500 mt-1.5" style={{ fontSize: 13 }}>
                  {errors.patientName.message}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Reminder times */}
        <section>
          <SectionHeader>Reminder times</SectionHeader>
          <div
            className="bg-white rounded-2xl overflow-hidden divide-y divide-gray-100"
            style={{ boxShadow: '0 1px 2px rgba(28,28,26,0.06)' }}
          >
            {TIME_SLOTS.map((slot) => (
              <div key={slot} className="flex items-center justify-between px-4 py-3.5">
                <span className="font-medium text-gray-900" style={{ fontSize: 15 }}>
                  {SLOT_LABELS[slot]}
                </span>
                <input
                  type="time"
                  {...register(`reminderTimes.${slot}` as const)}
                  className="border border-gray-200 bg-gray-50 rounded-xl px-3 py-1.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  style={{ fontSize: 14 }}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Notifications */}
        <section>
          <SectionHeader>Notifications</SectionHeader>
          <div
            className="bg-white rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 1px 2px rgba(28,28,26,0.06)' }}
          >
            <div className="px-4 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900" style={{ fontSize: 15 }}>
                  Dose reminders
                </p>
                <p className="text-gray-500 mt-0.5" style={{ fontSize: 13 }}>
                  Requires app opened at least once daily
                </p>
              </div>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => handleNotificationToggle(e.target.checked)}
                className="w-5 h-5 accent-blue-600 cursor-pointer"
              />
            </div>

            <div className="px-4 pb-4">
              <button
                type="button"
                onClick={async () => {
                  if (Notification.permission !== 'granted') {
                    addToast('Enable notifications first', 'error')
                    return
                  }
                  await sendTestNotification()
                }}
                className="w-full py-2.5 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                style={{ fontSize: 14 }}
              >
                Send test notification
              </button>
            </div>
          </div>
        </section>

        {/* Save button */}
        <button
          type="submit"
          disabled={!isDirty || update.isPending}
          className="w-full py-3.5 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors"
          style={{ fontSize: 15 }}
        >
          {update.isPending ? 'Saving…' : 'Save settings'}
        </button>
      </form>
    </main>
  )
}
