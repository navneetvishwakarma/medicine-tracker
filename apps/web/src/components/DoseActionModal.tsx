import { Check, X } from 'lucide-react'
import { useState } from 'react'
import type { DoseSlot } from '@/types'

const SLOT_LABELS: Record<string, string> = {
  morning: 'Morning',
  noon: 'Noon',
  evening: 'Evening',
  night: 'Night',
}

interface Props {
  slot: DoseSlot
  onAction: (status: 'taken' | 'skipped', note?: string) => void
  onClose: () => void
}

export default function DoseActionModal({ slot, onAction, onClose }: Props) {
  const [note, setNote] = useState(slot.log?.note ?? '')

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      style={{ backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-t-3xl pb-10"
        style={{ boxShadow: '0 -8px 32px rgba(28,28,26,0.16)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pt-3 pb-5">
          <p className="font-bold text-gray-900 leading-tight" style={{ fontSize: 17 }}>
            {slot.medicine.name}
          </p>
          <p className="text-gray-500 mt-0.5" style={{ fontSize: 14 }}>
            {slot.medicine.dosage} · {SLOT_LABELS[slot.scheduledTime]}
          </p>
        </div>

        {/* Action buttons */}
        <div className="px-4 flex gap-3 mb-4">
          <button
            onClick={() => onAction('taken', note || undefined)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-green-50 border border-green-200 text-green-700 rounded-2xl font-semibold transition-colors hover:bg-green-100 active:bg-green-200"
            style={{ fontSize: 15 }}
          >
            <Check size={18} strokeWidth={2.5} />
            Mark Taken
          </button>
          <button
            onClick={() => onAction('skipped', note || undefined)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-red-50 border border-red-200 text-red-600 rounded-2xl font-semibold transition-colors hover:bg-red-100 active:bg-red-200"
            style={{ fontSize: 15 }}
          >
            <X size={18} strokeWidth={2.5} />
            Mark Skipped
          </button>
        </div>

        {/* Note */}
        <div className="px-4">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            placeholder="Add a note (optional)…"
            rows={2}
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            style={{ fontSize: 14 }}
          />
        </div>
      </div>
    </div>
  )
}
