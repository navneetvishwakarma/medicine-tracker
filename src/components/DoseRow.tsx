import DoseChip from './DoseChip'
import type { DoseSlot, Medicine, MedicineColor } from '@/types'

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

interface Props {
  medicine: Medicine
  slots: DoseSlot[]
  onChipTap: (slot: DoseSlot) => void
  onChipLongPress: (slot: DoseSlot) => void
}

export default function DoseRow({ medicine, slots, onChipTap, onChipLongPress }: Props) {
  return (
    <div className="bg-white rounded-xl border p-3 flex items-center gap-3">
      <div className="flex items-center gap-2 w-32 shrink-0">
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${COLOR_MAP[medicine.color]}`} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{medicine.name}</p>
          <p className="text-xs text-gray-500 truncate">{medicine.dosage}</p>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap flex-1">
        {slots.map((slot) => (
          <DoseChip
            key={`${medicine.id}-${slot.scheduledTime}`}
            slot={slot.scheduledTime}
            log={slot.log}
            onTap={() => onChipTap(slot)}
            onLongPress={() => onChipLongPress(slot)}
          />
        ))}
      </div>
    </div>
  )
}
