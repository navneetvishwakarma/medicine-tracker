import { Check, X } from 'lucide-react'
import { useState } from 'react'
import type { DoseSlot } from '@/types'

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
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-t-2xl p-4 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
        <p className="font-semibold text-gray-900 mb-1">{slot.medicine.name}</p>
        <p className="text-sm text-gray-500 mb-4 capitalize">{slot.scheduledTime}</p>

        <div className="flex gap-3 mb-4">
          <button
            onClick={() => onAction('taken', note || undefined)}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-50 border border-green-300 text-green-700 rounded-xl font-medium hover:bg-green-100"
          >
            <Check size={18} />
            Mark Taken
          </button>
          <button
            onClick={() => onAction('skipped', note || undefined)}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 border border-red-300 text-red-600 rounded-xl font-medium hover:bg-red-100"
          >
            <X size={18} />
            Mark Skipped
          </button>
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
          placeholder="Add a note (optional)…"
          rows={2}
          className="w-full border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}
