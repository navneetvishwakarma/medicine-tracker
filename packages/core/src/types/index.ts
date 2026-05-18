import { z } from 'zod'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const TIME_SLOTS = ['morning', 'noon', 'evening', 'night'] as const
export type TimeSlot = (typeof TIME_SLOTS)[number]

export const MEAL_RELATIONS = ['before', 'after', 'with', 'none'] as const
export type MealRelation = (typeof MEAL_RELATIONS)[number]

export const DOSE_STATUSES = ['pending', 'taken', 'skipped'] as const
export type DoseStatus = (typeof DOSE_STATUSES)[number]

export const MEDICINE_COLORS = [
  'red', 'orange', 'yellow', 'green',
  'teal', 'blue', 'purple', 'pink',
] as const
export type MedicineColor = (typeof MEDICINE_COLORS)[number]

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

export const MedicineScheduleSchema = z.object({
  time: z.enum(TIME_SLOTS),
  hour: z.number().min(0).max(23),
  minute: z.number().min(0).max(59),
})

export const MedicineSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  dosage: z.string().min(1).max(50),
  mealRelation: z.enum(MEAL_RELATIONS),
  schedules: z.array(MedicineScheduleSchema).min(1),
  color: z.enum(MEDICINE_COLORS),
  notes: z.string().max(500).optional(),
  active: z.boolean(),
  createdAt: z.string().datetime(),
})

export const DoseLogSchema = z.object({
  id: z.string().uuid(),
  medicineId: z.string().uuid(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduledTime: z.enum(TIME_SLOTS),
  status: z.enum(DOSE_STATUSES),
  markedAt: z.string().datetime().optional(),
  markedBy: z.string().optional(),
  note: z.string().max(200).optional(),
})

export const AppSettingsSchema = z.object({
  id: z.literal(1),
  patientName: z.string().min(1).max(100),
  reminderTimes: z.object({
    morning: z.string().regex(/^\d{2}:\d{2}$/),
    noon: z.string().regex(/^\d{2}:\d{2}$/),
    evening: z.string().regex(/^\d{2}:\d{2}$/),
    night: z.string().regex(/^\d{2}:\d{2}$/),
  }),
  notificationsEnabled: z.boolean(),
})

// ─── TypeScript Types ─────────────────────────────────────────────────────────

export type MedicineSchedule = z.infer<typeof MedicineScheduleSchema>
export type Medicine = z.infer<typeof MedicineSchema>
export type DoseLog = z.infer<typeof DoseLogSchema>
export type AppSettings = z.infer<typeof AppSettingsSchema>

// ─── Domain types ─────────────────────────────────────────────────────────────

export interface DoseSlot {
  medicine: Medicine
  scheduledTime: TimeSlot
  scheduledDate: string
  log: DoseLog | null
}

export interface DateRange {
  from: string // YYYY-MM-DD
  to: string   // YYYY-MM-DD
}

export interface GridRow {
  medicineName: string
  dosage: string
  cells: Record<string, 'T' | 'S' | '–'> // date string → symbol
}

// ─── Default values ───────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: AppSettings = {
  id: 1,
  patientName: 'Patient',
  reminderTimes: {
    morning: '08:00',
    noon: '13:00',
    evening: '18:00',
    night: '21:00',
  },
  notificationsEnabled: false,
}
