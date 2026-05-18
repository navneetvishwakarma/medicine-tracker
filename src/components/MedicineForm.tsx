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

type FormValues = z.infer<typeof FormSchema>

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
      setValue(
        'schedules',
        schedules.filter((s) => s.time !== slot),
        { shouldValidate: true },
      )
    } else {
      setValue(
        'schedules',
        [...schedules, { time: slot, hour: DEFAULT_SLOT_HOURS[slot], minute: 0 }],
        { shouldValidate: true },
      )
    }
  }

  const updateSlotTime = (slot: string, hour: number, minute: number) => {
    setValue(
      'schedules',
      schedules.map((s) => (s.time === slot ? { ...s, hour, minute } : s)),
    )
  }

  useEffect(() => {
    // keep schedules sorted by slot order
    if (schedules.length > 1) {
      const order = TIME_SLOTS.reduce<Record<string, number>>((acc, s, i) => ({ ...acc, [s]: i }), {})
      const sorted = [...schedules].sort((a, b) => order[a.time] - order[b.time])
      const changed = sorted.some((s, i) => s.time !== schedules[i].time)
      if (changed) setValue('schedules', sorted)
    }
  }, [schedules, setValue])

  const submit = (values: FormValues) => onSubmit(values, initial?.id)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90dvh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
          <h2 className="font-semibold text-lg">{initial ? 'Edit Medicine' : 'Add Medicine'}</h2>
          <button onClick={onCancel} className="p-1 rounded-lg hover:bg-gray-100" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(submit)} className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Medicine name <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name')}
              placeholder="e.g. BRILINTA 90"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* Dosage */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Dosage <span className="text-red-500">*</span>
            </label>
            <input
              {...register('dosage')}
              placeholder="e.g. 90mg"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.dosage && <p className="text-red-500 text-xs mt-1">{errors.dosage.message}</p>}
          </div>

          {/* Meal relation */}
          <div>
            <label className="block text-sm font-medium mb-1">With meals</label>
            <select
              {...register('mealRelation')}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium mb-2">
              Schedule <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {TIME_SLOTS.map((slot) => {
                const active = schedules.find((s) => s.time === slot)
                return (
                  <div key={slot} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleSlot(slot)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                        active
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-gray-50 border-gray-200 text-gray-500'
                      }`}
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
                        className="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                )
              })}
            </div>
            {errors.schedules && (
              <p className="text-red-500 text-xs mt-1">{errors.schedules.message}</p>
            )}
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {MEDICINE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue('color', c)}
                  className={`w-8 h-8 rounded-full ${COLOR_MAP[c]} ${
                    selectedColor === c ? 'ring-2 ring-offset-2 ring-gray-700' : ''
                  }`}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">Notes (optional)</label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="Any instructions or reminders…"
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              {initial ? 'Save changes' : 'Add medicine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
