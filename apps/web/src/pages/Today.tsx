import { useMemo, useRef, useState } from 'react'
import { Check, Minus, X } from 'lucide-react'
import { format, isToday, parseISO, subDays } from 'date-fns'
import DateNav from '@/components/DateNav'
import DoseActionModal from '@/components/DoseActionModal'
import MissedDoseBanner from '@/components/MissedDoseBanner'
import { useDoseLogsForDate, useDoseLogsForRange, useUpsertDoseLog } from '@/hooks/useDoseLogs'
import { useMedicines } from '@/hooks/useMedicines'
import { useSettings } from '@/hooks/useSettings'
import { getDailySlots, getMissedDoses } from '@/domain/scheduling'
import { useUIStore } from '@/store/useUIStore'
import { useAuth } from '@/context/AuthContext'
import { useAppRole } from '@/App'
import {
  DEFAULT_SETTINGS,
  TIME_SLOTS,
  type DoseLog,
  type DoseSlot,
  type MealRelation,
  type MedicineColor,
  type TimeSlot,
} from '@/types'

// ── Constants ────────────────────────────────────────────────────────────────

const SLOT_LABELS: Record<TimeSlot, string> = {
  morning: 'Morning',
  noon: 'Noon',
  evening: 'Evening',
  night: 'Night',
}

const MEAL_LABELS: Record<MealRelation, string> = {
  before: 'Before meals',
  after: 'After meals',
  with: 'With meals',
  none: '',
}

const MED_COLOR_BAR: Record<MedicineColor, string> = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-400',
  green: 'bg-green-500',
  teal: 'bg-teal-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatReminderTime(timeStr: string): string {
  const [hStr, mStr] = timeStr.split(':')
  const h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return m === 0 ? `${hour12} ${period}` : `${hour12}:${mStr} ${period}`
}

function getCurrentSlot(
  reminderTimes: typeof DEFAULT_SETTINGS.reminderTimes,
): TimeSlot | null {
  const now = new Date()
  const nowMins = now.getHours() * 60 + now.getMinutes()

  const entries = (Object.entries(reminderTimes) as [TimeSlot, string][])
    .map(([slot, time]) => {
      const [h, m] = time.split(':').map(Number)
      return { slot, mins: h * 60 + m }
    })
    .sort((a, b) => a.mins - b.mins)

  for (let i = 0; i < entries.length; i++) {
    const { slot, mins } = entries[i]
    const nextMins = i + 1 < entries.length ? entries[i + 1].mins : Infinity
    // From 30 min before this slot's time until 30 min before the next slot
    if (nowMins >= mins - 30 && nowMins < nextMins - 30) return slot
  }

  // Past last slot but within 3 hours — still highlight it
  const last = entries[entries.length - 1]
  if (last && nowMins >= last.mins - 30 && nowMins < last.mins + 180) {
    return last.slot
  }
  return null
}

// ── MedicineSlotCard ─────────────────────────────────────────────────────────

interface SlotCardProps {
  doseSlot: DoseSlot
  onTap: () => void
  onLongPress: () => void
}

function MedicineSlotCard({ doseSlot, onTap, onLongPress }: SlotCardProps) {
  const { medicine, log } = doseSlot
  const status = log?.status ?? 'pending'
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handlePointerDown = () => {
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      onLongPress()
    }, 480)
  }
  const handlePointerUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
      onTap()
    }
  }
  const handlePointerCancel = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const mealLabel = MEAL_LABELS[medicine.mealRelation]
  const subtitle = [medicine.dosage, mealLabel || null].filter(Boolean).join(' · ')

  const pillStyles = {
    pending: 'bg-gray-100 text-gray-500',
    taken: 'bg-green-100 text-green-700 border border-green-200',
    skipped: 'bg-red-50 text-red-600 border border-red-200',
  }[status]

  const pillIcon = {
    pending: <Minus size={12} strokeWidth={2} />,
    taken: <Check size={12} strokeWidth={2.5} />,
    skipped: <X size={12} strokeWidth={2.5} />,
  }[status]

  const pillLabel = { pending: 'Pending', taken: 'Taken', skipped: 'Skipped' }[status]

  return (
    <div
      className="bg-white rounded-2xl flex items-center overflow-hidden"
      style={{ boxShadow: '0 1px 2px rgba(28,28,26,0.06), 0 1px 4px rgba(28,28,26,0.04)' }}
    >
      <div className={`w-[3px] self-stretch shrink-0 ${MED_COLOR_BAR[medicine.color]}`} />

      <div className="flex-1 px-3.5 py-3.5 min-w-0">
        <p
          className="font-semibold text-gray-900 truncate leading-snug"
          style={{ fontSize: 15 }}
        >
          {medicine.name}
        </p>
        {subtitle && (
          <p className="text-gray-500 mt-0.5 truncate" style={{ fontSize: 13 }}>
            {subtitle}
          </p>
        )}
      </div>

      <button
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerCancel}
        onPointerCancel={handlePointerCancel}
        className={`mx-3 shrink-0 px-3.5 py-2 rounded-full flex items-center gap-1.5 font-semibold transition-colors select-none ${pillStyles}`}
        style={{ fontSize: 13 }}
        aria-label={`${medicine.name}: ${pillLabel}. Tap to mark taken, hold for options.`}
        data-testid={`status-pill-${medicine.id}`}
      >
        {pillIcon}
        {pillLabel}
      </button>
    </div>
  )
}

// ── Today page ───────────────────────────────────────────────────────────────

export default function Today() {
  const { activeDate, setActiveDate, missedBannerDismissed, dismissMissedBanner } =
    useUIStore()
  const { user } = useAuth()
  const { role } = useAppRole()
  const isViewer = role === 'viewer'
  const { data: medicines = [], isError: medicinesError, isLoading } = useMedicines()
  const { data: logs = [], isError: logsError } = useDoseLogsForDate(activeDate)
  const { data: settings } = useSettings()
  const upsert = useUpsertDoseLog()
  const [activeSlot, setActiveSlot] = useState<DoseSlot | null>(null)
  const [confirmSlot, setConfirmSlot] = useState<DoseSlot | null>(null)

  const currentUserLabel = user?.user_metadata?.full_name ?? user?.email ?? 'User'

  const { past7Start, yesterday } = useMemo(
    () => ({
      past7Start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
      yesterday: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
    }),
    [],
  )

  const { data: pastLogs = [] } = useDoseLogsForRange(past7Start, yesterday)
  const missedDoses = missedBannerDismissed ? [] : getMissedDoses(pastLogs, new Date())
  const medicineNameMap = Object.fromEntries(medicines.map((m) => [m.id, m.name]))

  const slots = getDailySlots(medicines, activeDate, logs)

  const reminderTimes = settings?.reminderTimes ?? DEFAULT_SETTINGS.reminderTimes
  const isViewingToday = isToday(parseISO(activeDate))
  const currentSlot = isViewingToday ? getCurrentSlot(reminderTimes) : null

  const slotGroups = useMemo(
    () =>
      TIME_SLOTS.map((slotName) => {
        const entries = slots.filter((s) => s.scheduledTime === slotName)
        return {
          slotName,
          time: formatReminderTime(reminderTimes[slotName]),
          entries,
          isCurrent: currentSlot === slotName,
          allTaken:
            entries.length > 0 && entries.every((s) => s.log?.status === 'taken'),
        }
      }).filter((g) => g.entries.length > 0),
    [slots, reminderTimes, currentSlot],
  )

  const handleTap = (slot: DoseSlot) => {
    const currentStatus = slot.log?.status ?? 'pending'
    // If already marked by someone else, ask for confirmation before overwriting
    if (
      currentStatus === 'taken' &&
      slot.log?.markedBy &&
      slot.log.markedBy !== currentUserLabel
    ) {
      setConfirmSlot(slot)
      return
    }
    applyTap(slot)
  }

  const applyTap = (slot: DoseSlot) => {
    const currentStatus = slot.log?.status ?? 'pending'
    const newStatus = currentStatus === 'taken' ? 'pending' : 'taken'
    const log: DoseLog = slot.log
      ? {
          ...slot.log,
          status: newStatus,
          markedAt: newStatus === 'taken' ? new Date().toISOString() : undefined,
          markedBy: newStatus === 'taken' ? currentUserLabel : undefined,
        }
      : {
          id: crypto.randomUUID(),
          medicineId: slot.medicine.id,
          scheduledDate: slot.scheduledDate,
          scheduledTime: slot.scheduledTime,
          status: newStatus,
          markedAt: newStatus === 'taken' ? new Date().toISOString() : undefined,
          markedBy: newStatus === 'taken' ? currentUserLabel : undefined,
        }
    upsert.mutate(log)
  }

  const handleAction = (status: 'taken' | 'skipped', note?: string) => {
    if (!activeSlot) return
    const log: DoseLog = activeSlot.log
      ? { ...activeSlot.log, status, markedAt: new Date().toISOString(), markedBy: currentUserLabel, note }
      : {
          id: crypto.randomUUID(),
          medicineId: activeSlot.medicine.id,
          scheduledDate: activeSlot.scheduledDate,
          scheduledTime: activeSlot.scheduledTime,
          status,
          markedAt: new Date().toISOString(),
          markedBy: currentUserLabel,
          note,
        }
    upsert.mutate(log, { onSuccess: () => setActiveSlot(null) })
  }

  return (
    <div className="min-h-full">
      <DateNav date={activeDate} onChange={setActiveDate} />

      {(medicinesError || logsError) && (
        <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
          Failed to load data. Please restart the app.
        </div>
      )}

      <MissedDoseBanner
        missedLogs={missedDoses}
        onAction={(log, status) =>
          upsert.mutate({ ...log, status, markedAt: new Date().toISOString() })
        }
        onDismiss={dismissMissedBanner}
        getMedicineName={(id) => medicineNameMap[id] ?? 'Unknown'}
      />

      <main className="pb-8">
        {isLoading && (
          <div className="px-4 pt-6 space-y-6">
            {[1, 2].map((g) => (
              <div key={g}>
                <div className="h-3 w-24 bg-gray-100 rounded-full mb-3 animate-pulse" />
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-[68px] bg-gray-100 rounded-2xl animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && slotGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
            <div className="text-5xl mb-5">💊</div>
            <p className="font-semibold text-gray-800" style={{ fontSize: 18 }}>
              No medicines scheduled
            </p>
            <p className="text-gray-500 mt-2 leading-relaxed max-w-xs" style={{ fontSize: 14 }}>
              Add medicines in the Medicines tab to start tracking your doses.
            </p>
          </div>
        ) : !isLoading && (
          slotGroups.map((group) => (
            <div key={group.slotName}>
              {/* Slot section header */}
              <div className="flex items-center px-4 pt-6 pb-2.5 gap-2">
                <div className="flex items-baseline gap-2 flex-1 min-w-0">
                  <span
                    className="font-bold text-gray-400 uppercase tracking-widest"
                    style={{ fontSize: 11 }}
                  >
                    {SLOT_LABELS[group.slotName]}
                  </span>
                  <span className="text-gray-400" style={{ fontSize: 12 }}>
                    {group.time}
                  </span>
                </div>
                {group.isCurrent && !group.allTaken && (
                  <span
                    className="bg-blue-50 text-blue-600 font-bold uppercase tracking-wide px-2.5 py-1 rounded-full"
                    style={{ fontSize: 10 }}
                  >
                    Now
                  </span>
                )}
                {group.allTaken && (
                  <span className="text-green-600 font-semibold" style={{ fontSize: 12 }}>
                    ✓ All done
                  </span>
                )}
              </div>

              {/* Medicine cards */}
              <div className="px-4 space-y-2">
                {group.entries.map((doseSlot) => (
                  <MedicineSlotCard
                    key={`${doseSlot.medicine.id}-${doseSlot.scheduledTime}`}
                    doseSlot={doseSlot}
                    onTap={isViewer ? () => {} : () => handleTap(doseSlot)}
                    onLongPress={isViewer ? () => {} : () => setActiveSlot(doseSlot)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </main>

      {activeSlot && (
        <DoseActionModal
          slot={activeSlot}
          onAction={handleAction}
          onClose={() => setActiveSlot(null)}
        />
      )}

      {confirmSlot && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm override"
        >
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-xl">
            <p className="font-semibold text-gray-900 mb-1" style={{ fontSize: 16 }}>
              Already marked by {confirmSlot.log?.markedBy}
            </p>
            <p className="text-gray-500 mb-5" style={{ fontSize: 14 }}>
              This dose was already marked taken by {confirmSlot.log?.markedBy}. Do you
              want to override it?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  applyTap(confirmSlot)
                  setConfirmSlot(null)
                }}
                className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-colors"
                style={{ fontSize: 15 }}
              >
                Override
              </button>
              <button
                onClick={() => setConfirmSlot(null)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl font-semibold hover:bg-gray-200 transition-colors"
                style={{ fontSize: 15 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
