import { AlertCircle, ChevronRight, X } from 'lucide-react'
import { useState } from 'react'
import type { DoseLog } from '@/types'

interface Props {
  missedLogs: DoseLog[]
  onAction: (log: DoseLog, status: 'taken' | 'skipped') => void
  onDismiss: () => void
  getMedicineName: (id: string) => string
}

export default function MissedDoseBanner({ missedLogs, onAction, onDismiss, getMedicineName }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false)

  if (missedLogs.length === 0) return null

  return (
    <>
      {/* Banner */}
      <div
        className="mx-4 mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3 cursor-pointer"
        onClick={() => setSheetOpen(true)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSheetOpen(true) } }}
        role="button"
        tabIndex={0}
        aria-label="View missed doses"
      >
        <AlertCircle size={18} className="text-amber-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-800">
            {missedLogs.length} missed dose{missedLogs.length > 1 ? 's' : ''}
          </p>
          <p className="text-xs text-amber-600">Tap to review</p>
        </div>
        <ChevronRight size={16} className="text-amber-500 shrink-0" />
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss() }}
          className="p-1 rounded-lg hover:bg-amber-100 text-amber-600"
          aria-label="Dismiss banner"
        >
          <X size={16} />
        </button>
      </div>

      {/* Bottom sheet */}
      {sheetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => setSheetOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-2xl max-h-[70dvh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between shrink-0">
              <h2 className="font-semibold text-gray-900">Missed doses</h2>
              <button
                onClick={() => setSheetOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {missedLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-gray-50 rounded-xl p-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {getMedicineName(log.medicineId)}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {log.scheduledDate} · {log.scheduledTime}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => onAction(log, 'taken')}
                      className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200"
                    >
                      Taken
                    </button>
                    <button
                      onClick={() => onAction(log, 'skipped')}
                      className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-medium hover:bg-red-200"
                    >
                      Skipped
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
