import type { DoseLog, DoseSlot, Medicine } from '@/types'

export function getDailySlots(
  medicines: Medicine[],
  date: string,
  logs: DoseLog[],
): DoseSlot[] {
  const logsForDate = logs.filter((l) => l.scheduledDate === date)

  return medicines.flatMap((medicine) =>
    medicine.schedules.map((schedule) => {
      const log =
        logsForDate.find(
          (l) => l.medicineId === medicine.id && l.scheduledTime === schedule.time,
        ) ?? null
      return {
        medicine,
        scheduledTime: schedule.time,
        scheduledDate: date,
        log,
      } satisfies DoseSlot
    }),
  )
}

export function getMissedDoses(logs: DoseLog[], asOf: Date): DoseLog[] {
  const today = asOf.toISOString().split('T')[0]
  return logs.filter((l) => l.status === 'pending' && l.scheduledDate < today)
}

export function getAdherence(logs: DoseLog[], from: string, to: string): number {
  const inRange = logs.filter((l) => l.scheduledDate >= from && l.scheduledDate <= to)
  if (inRange.length === 0) return 0
  const taken = inRange.filter((l) => l.status === 'taken').length
  return taken / inRange.length
}
