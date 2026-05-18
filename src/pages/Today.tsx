import { useState } from 'react'
import DateNav from '@/components/DateNav'
import DoseActionModal from '@/components/DoseActionModal'
import DoseRow from '@/components/DoseRow'
import MissedDoseBanner from '@/components/MissedDoseBanner'
import { useDoseLogsForDate, useDoseLogsForRange, useUpsertDoseLog } from '@/hooks/useDoseLogs'
import { useMedicines } from '@/hooks/useMedicines'
import { getDailySlots, getMissedDoses } from '@/domain/scheduling'
import { useUIStore } from '@/store/useUIStore'
import { format, subDays } from 'date-fns'
import type { DoseLog, DoseSlot } from '@/types'

export default function Today() {
  const { activeDate, setActiveDate, missedBannerDismissed, dismissMissedBanner } = useUIStore()
  const { data: medicines = [] } = useMedicines()
  const { data: logs = [] } = useDoseLogsForDate(activeDate)
  const past7Start = format(subDays(new Date(), 7), 'yyyy-MM-dd')
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')
  const { data: pastLogs = [] } = useDoseLogsForRange(past7Start, yesterday)
  const upsert = useUpsertDoseLog()
  const [activeSlot, setActiveSlot] = useState<DoseSlot | null>(null)

  const missedDoses = missedBannerDismissed ? [] : getMissedDoses(pastLogs, new Date())
  const medicineNameMap = Object.fromEntries(medicines.map((m) => [m.id, m.name]))

  const slots = getDailySlots(medicines, activeDate, logs)

  // Group slots by medicine
  const byMedicine = medicines
    .map((med) => ({
      medicine: med,
      slots: slots.filter((s) => s.medicine.id === med.id),
    }))
    .filter((g) => g.slots.length > 0)

  const handleTap = (slot: DoseSlot) => {
    const currentStatus = slot.log?.status ?? 'pending'
    const newStatus = currentStatus === 'taken' ? 'pending' : 'taken'
    const log: DoseLog = slot.log
      ? { ...slot.log, status: newStatus, markedAt: newStatus === 'taken' ? new Date().toISOString() : undefined }
      : {
          id: crypto.randomUUID(),
          medicineId: slot.medicine.id,
          scheduledDate: slot.scheduledDate,
          scheduledTime: slot.scheduledTime,
          status: newStatus,
          markedAt: newStatus === 'taken' ? new Date().toISOString() : undefined,
        }
    upsert.mutate(log)
  }

  const handleAction = (status: 'taken' | 'skipped', note?: string) => {
    if (!activeSlot) return
    const log: DoseLog = activeSlot.log
      ? { ...activeSlot.log, status, markedAt: new Date().toISOString(), note }
      : {
          id: crypto.randomUUID(),
          medicineId: activeSlot.medicine.id,
          scheduledDate: activeSlot.scheduledDate,
          scheduledTime: activeSlot.scheduledTime,
          status,
          markedAt: new Date().toISOString(),
          note,
        }
    upsert.mutate(log, { onSuccess: () => setActiveSlot(null) })
  }

  return (
    <div>
      <DateNav date={activeDate} onChange={setActiveDate} />

      <MissedDoseBanner
        missedLogs={missedDoses}
        onAction={(log, status) =>
          upsert.mutate({ ...log, status, markedAt: new Date().toISOString() })
        }
        onDismiss={dismissMissedBanner}
        getMedicineName={(id) => medicineNameMap[id] ?? 'Unknown'}
      />

      <main className="p-4 pb-6 space-y-3">
        {byMedicine.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">💊</p>
            <p className="font-medium text-gray-700">No medicines scheduled</p>
            <p className="text-sm text-gray-500 mt-1">
              Add medicines in the Medicines tab to start tracking.
            </p>
          </div>
        )}

        {byMedicine.map(({ medicine, slots: medSlots }) => (
          <DoseRow
            key={medicine.id}
            medicine={medicine}
            slots={medSlots}
            onChipTap={handleTap}
            onChipLongPress={setActiveSlot}
          />
        ))}
      </main>

      {activeSlot && (
        <DoseActionModal
          slot={activeSlot}
          onAction={handleAction}
          onClose={() => setActiveSlot(null)}
        />
      )}
    </div>
  )
}
