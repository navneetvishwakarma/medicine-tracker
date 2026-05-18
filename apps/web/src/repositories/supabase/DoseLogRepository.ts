import type { DoseLog, TimeSlot, DoseStatus } from '@medicine-tracker/core'
import type { IDoseLogRepository } from '@medicine-tracker/core'
import { supabase } from '@/lib/supabase'

type DbDoseLog = {
  id: string
  user_id: string
  medicine_id: string
  scheduled_date: string
  scheduled_time: string
  status: string
  marked_at?: string | null
  marked_by?: string | null
  note?: string | null
}

function toDoseLog(row: DbDoseLog): DoseLog {
  return {
    id: row.id,
    medicineId: row.medicine_id,
    scheduledDate: row.scheduled_date,
    scheduledTime: row.scheduled_time as TimeSlot,
    status: row.status as DoseStatus,
    markedAt: row.marked_at ?? undefined,
    note: row.note ?? undefined,
  }
}

function toDb(log: DoseLog, userId: string): DbDoseLog {
  return {
    id: log.id,
    user_id: userId,
    medicine_id: log.medicineId,
    scheduled_date: log.scheduledDate,
    scheduled_time: log.scheduledTime,
    status: log.status,
    marked_at: log.markedAt ?? null,
    marked_by: null,
    note: log.note ?? null,
  }
}

export class SupabaseDoseLogRepository implements IDoseLogRepository {
  constructor(private readonly userId: string) {}

  async getByDate(date: string): Promise<DoseLog[]> {
    const { data, error } = await supabase
      .from('dose_logs')
      .select()
      .eq('scheduled_date', date)
    if (error) throw error
    return (data ?? []).map(toDoseLog)
  }

  async getByRange(from: string, to: string): Promise<DoseLog[]> {
    const { data, error } = await supabase
      .from('dose_logs')
      .select()
      .gte('scheduled_date', from)
      .lte('scheduled_date', to)
    if (error) throw error
    return (data ?? []).map(toDoseLog)
  }

  async upsert(log: DoseLog): Promise<void> {
    const { error } = await supabase
      .from('dose_logs')
      .upsert(toDb(log, this.userId))
    if (error) throw error
  }
}
