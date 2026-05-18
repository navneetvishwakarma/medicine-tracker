import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  MEAL_RELATIONS,
  MEDICINE_COLORS,
  MedicineScheduleSchema,
  TIME_SLOTS,
  type Medicine,
  type MedicineColor,
} from '@/types'

const FormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  dosage: z.string().min(1, 'Dosage is required').max(50),
  mealRelation: z.enum(MEAL_RELATIONS),
  color: z.enum(MEDICINE_COLORS),
  notes: z.string().max(500).optional(),
  schedules: z.array(MedicineScheduleSchema).min(1, 'At least one time slot is required'),
})

export type FormValues = z.infer<typeof FormSchema>

const COLOR_MAP: Record<MedicineColor, string> = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-400',
  green: 'bg-green-500',
  teal: 'bg-teal-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
}

const SLOT_LABELS: Record<string, string> = {
  morning: 'Morning',
  noon: 'Noon',
  evening: 'Evening',
  night: 'Night',
}

const DEFAULT_SLOT_HOURS: Record<string, number> = {
  morning: 8,
  noon: 13,
  evening: 18,
  night: 21,
}

const inputClass =
  'w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow'

interface Props {
  initial?: Medicine
  onSubmit: (values: FormValues, id?: string) => void
  onCancel: () => void
}

export default function MedicineForm({ initial, onSubmit, onCancel }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: initial
      ? {
          name: initial.name,
          dosage: initial.dosage,
          mealRelation: initial.mealRelation,
          color: initial.color,
          notes: initial.notes ?? '',
          schedules: initial.schedules,
        }
      : {
          mealRelation: 'none',
          color: 'blue',
          schedules: [],
        },
  })

  const schedules = watch('schedules')
  const selectedColor = watch('color')

  const toggleSlot = (slot: (typeof TIME_SLOTS)[number]) => {
    const exists = schedules.find((s) => s.time === slot)
    if (exists) {
      setValue('schedules', schedules.filter((s) => s.time !== slot), { shouldValidate: true })
    } else {
      setValue(
        'schedules',
        [...schedules, { time: slot, hour: DEFAULT_SLOT_HOURS[slot], minute: 0 }],
        { shouldValidate: true },
      )
    }
  }

  const updateSlotTime = (slot: string, hour: number, minute: number) => {
    setValue('schedules', schedules.map((s) => (s.time === slot ? { ...s, hour, minute } : s)))
  }

  useEffect(() => {
    if (schedules.length > 1) {
      const order = TIME_SLOTS.reduce<Record<string, number>>(
        (acc, s, i) => ({ ...acc, [s]: i }),
        {},
      )
      const sorted = [...schedules].sort((a, b) => order[a.time] - order[b.time])
      const changed = sorted.some((s, i) => s.time !== schedules[i].time)
      if (changed) setValue('schedules', sorted)
    }
  }, [schedules, setValue])

  const submit = (values: FormValues) => onSubmit(values, initial?.id)

  const FieldLabel = ({
    children,
    required,
  }: {
    children: React.ReactNode
    required?: boolean
  }) => (
    <label
      className="block font-medium text-gray-700 mb-1.5"
      style={{ fontSize: 14 }}
    >
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )

  const FieldError = ({ message }: { message?: string }) =>
    message ? (
      <p className="text-red-500 mt-1.5" style={{ fontSize: 13 }}>
        {message}
      </p>
    ) : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
      style={{ backdropFilter: 'blur(2px)' }}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92dvh] flex flex-col"
        style={{ boxShadow: '0 -8px 32px rgba(28,28,26,0.16)' }}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
          <div className="w-9 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0"
        >
          <h2 className="font-bold text-gray-900" style={{ fontSize: 17 }}>
            {initial ? 'Edit Medicine' : 'Add Medicine'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable form body */}
        <form
          onSubmit={handleSubmit(submit)}
          className="overflow-y-auto flex-1 px-5 py-5 space-y-5"
        >
          {/* Name */}
          <div>
            <FieldLabel required>Medicine name</FieldLabel>
            <input
              {...register('name')}
              placeholder="e.g. BRILINTA 90"
              className={inputClass}
              style={{ fontSize: 15 }}
            />
            <FieldError message={errors.name?.message} />
          </div>

          {/* Dosage */}
          <div>
            <FieldLabel required>Dosage</FieldLabel>
            <input
              {...register('dosage')}
              placeholder="e.g. 90mg"
              className={inputClass}
              style={{ fontSize: 15 }}
            />
            <FieldError message={errors.dosage?.message} />
          </div>

          {/* Meal relation */}
          <div>
            <FieldLabel>With meals</FieldLabel>
            <select
              {...register('mealRelation')}
              className={inputClass}
              style={{ fontSize: 15 }}
            >
              {MEAL_RELATIONS.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)} meals
                </option>
              ))}
            </select>
          </div>

          {/* Time slots */}
          <div>
            <FieldLabel required>Schedule</FieldLabel>
            <div className="space-y-2">
              {TIME_SLOTS.map((slot) => {
                const active = schedules.find((s) => s.time === slot)
                return (
                  <div key={slot} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleSlot(slot)}
                      className={`flex-1 py-2.5 px-4 rounded-xl font-semibold border transition-colors ${
                        active
                          ? 'bg-blue-50 border-blue-400 text-blue-700'
                          : 'bg-gray-50 border-gray-200 text-gray-500'
                      }`}
                      style={{ fontSize: 14 }}
                    >
                      {SLOT_LABELS[slot]}
                    </button>
                    {active && (
                      <input
                        type="time"
                        value={`${String(active.hour).padStart(2, '0')}:${String(active.minute).padStart(2, '0')}`}
                        onChange={(e) => {
                          const [h, m] = e.target.value.split(':').map(Number)
                          updateSlotTime(slot, h, m)
                        }}
                        className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                        style={{ fontSize: 14 }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
            <FieldError message={errors.schedules?.message} />
          </div>

          {/* Color */}
          <div>
            <FieldLabel>Color</FieldLabel>
            <div className="flex gap-2.5 flex-wrap">
              {MEDICINE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue('color', c)}
                  className={`w-9 h-9 rounded-full transition-transform ${COLOR_MAP[c]} ${
                    selectedColor === c
                      ? 'ring-2 ring-offset-2 ring-gray-800 scale-110'
                      : 'hover:scale-105'
                  }`}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <FieldLabel>Notes</FieldLabel>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="Any instructions or reminders…"
              className={`${inputClass} resize-none`}
              style={{ fontSize: 15 }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1 pb-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 border border-gray-200 rounded-2xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              style={{ fontSize: 15 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-colors"
              style={{ fontSize: 15 }}
            >
              {initial ? 'Save changes' : 'Add medicine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
