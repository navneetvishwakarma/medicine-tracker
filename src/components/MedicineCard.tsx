import { Archive, Edit3 } from 'lucide-react'
import type { Medicine, MedicineColor } from '@/types'

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
  morning: 'AM',
  noon: 'Noon',
  evening: 'PM',
  night: 'Night',
}

interface Props {
  medicine: Medicine
  onEdit: (medicine: Medicine) => void
  onArchive: (id: string) => void
}

export default function MedicineCard({ medicine, onEdit, onArchive }: Props) {
  return (
    <div className="bg-white rounded-xl border p-4 flex items-start gap-3">
      <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${COLOR_MAP[medicine.color]}`} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{medicine.name}</p>
        <p className="text-sm text-gray-500">{medicine.dosage}</p>
        <div className="flex flex-wrap gap-1 mt-2">
          {medicine.schedules.map((s) => (
            <span
              key={s.time}
              className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
            >
              {SLOT_LABELS[s.time]} {String(s.hour).padStart(2, '0')}:{String(s.minute).padStart(2, '0')}
            </span>
          ))}
        </div>
        {medicine.notes && (
          <p className="text-xs text-gray-400 mt-1 truncate">{medicine.notes}</p>
        )}
      </div>
      <div className="flex gap-1 shrink-0">
        <button
          onClick={() => onEdit(medicine)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          aria-label={`Edit ${medicine.name}`}
        >
          <Edit3 size={16} />
        </button>
        <button
          onClick={() => onArchive(medicine.id)}
          className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"
          aria-label={`Archive ${medicine.name}`}
        >
          <Archive size={16} />
        </button>
      </div>
    </div>
  )
}
