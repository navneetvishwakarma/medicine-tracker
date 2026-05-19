import { addDays, format, parseISO } from 'date-fns'
import type { DateRange, DoseLog, GridRow, Medicine } from '@/types'

export function buildGridData(
  medicines: Medicine[],
  logs: DoseLog[],
  { from, to }: DateRange,
): GridRow[] {
  const dates: string[] = []
  let cur = parseISO(from)
  const end = parseISO(to)
  while (cur <= end) {
    dates.push(format(cur, 'yyyy-MM-dd'))
    cur = addDays(cur, 1)
  }

  const logIndex: Record<string, Record<string, 'T' | 'S' | '–'>> = {}
  for (const log of logs) {
    if (!logIndex[log.medicineId]) logIndex[log.medicineId] = {}
    const sym = log.status === 'taken' ? 'T' : log.status === 'skipped' ? 'S' : '–'
    const existing = logIndex[log.medicineId][log.scheduledDate]
    // taken > skipped > pending
    if (!existing || (existing === '–') || (existing === 'S' && sym === 'T')) {
      logIndex[log.medicineId][log.scheduledDate] = sym
    }
  }

  return medicines.map((med) => ({
    medicineName: med.name,
    dosage: med.dosage,
    cells: Object.fromEntries(dates.map((d) => [d, logIndex[med.id]?.[d] ?? '–'])),
  }))
}
