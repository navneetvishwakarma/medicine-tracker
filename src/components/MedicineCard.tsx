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
    <div
      className="bg-white rounded-2xl flex items-stretch overflow-hidden"
      style={{ boxShadow: '0 1px 2px rgba(28,28,26,0.06), 0 1px 4px rgba(28,28,26,0.04)' }}
    >
      {/* Left color accent bar */}
      <div className={`w-[3px] shrink-0 ${COLOR_MAP[medicine.color]}`} />

      {/* Content */}
      <div className="flex-1 px-4 py-3.5 min-w-0">
        <p className="font-semibold text-gray-900 truncate leading-snug" style={{ fontSize: 15 }}>
          {medicine.name}
        </p>
        <p className="text-gray-500 mt-0.5" style={{ fontSize: 13 }}>
          {medicine.dosage}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {medicine.schedules.map((s) => (
            <span
              key={s.time}
              className="bg-gray-100 text-gray-600 rounded-full px-2.5 py-0.5"
              style={{ fontSize: 11 }}
            >
              {SLOT_LABELS[s.time]}{' '}
              {String(s.hour).padStart(2, '0')}:{String(s.minute).padStart(2, '0')}
            </span>
          ))}
        </div>
        {medicine.notes && (
          <p className="text-gray-400 mt-1.5 truncate" style={{ fontSize: 12 }}>
            {medicine.notes}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col justify-center gap-1 pr-2 py-3 shrink-0">
        <button
          onClick={() => onEdit(medicine)}
          className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          aria-label={`Edit ${medicine.name}`}
        >
          <Edit3 size={16} />
        </button>
        <button
          onClick={() => onArchive(medicine.id)}
          className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          aria-label={`Archive ${medicine.name}`}
        >
          <Archive size={16} />
        </button>
      </div>
    </div>
  )
}
