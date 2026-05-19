import type { DoseLog, TimeSlot, DoseStatus } from '@medicine-tracker/core'
import type { IDoseLogRepository } from '@medicine-tracker/core'
import { db } from './db'

type DbRow = {
  id: string
  medicine_id: string
  scheduled_date: string
  scheduled_time: string
  status: string
  marked_at: string | null
  marked_by: string | null
  note: string | null
}

function toDoseLog(row: DbRow): DoseLog {
  return {
    id: row.id,
    medicineId: row.medicine_id,
    scheduledDate: row.scheduled_date,
    scheduledTime: row.scheduled_time as TimeSlot,
    status: row.status as DoseStatus,
    markedAt: row.marked_at ?? undefined,
    markedBy: row.marked_by ?? undefined,
    note: row.note ?? undefined,
  }
}

export class SqliteDoseLogRepository implements IDoseLogRepository {
  async getByDate(date: string): Promise<DoseLog[]> {
    const rows = await db.getAllAsync<DbRow>(
      'SELECT * FROM dose_logs WHERE scheduled_date = ?',
      [date],
    )
    return rows.map(toDoseLog)
  }

  async getByRange(from: string, to: string): Promise<DoseLog[]> {
    const rows = await db.getAllAsync<DbRow>(
      'SELECT * FROM dose_logs WHERE scheduled_date BETWEEN ? AND ?',
      [from, to],
    )
    return rows.map(toDoseLog)
  }

  async upsert(log: DoseLog): Promise<void> {
    await db.runAsync(
      `INSERT OR REPLACE INTO dose_logs
         (id, medicine_id, scheduled_date, scheduled_time, status, marked_at, marked_by, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        log.id,
        log.medicineId,
        log.scheduledDate,
        log.scheduledTime,
        log.status,
        log.markedAt ?? null,
        log.markedBy ?? null,
        log.note ?? null,
      ],
    )
  }
}
