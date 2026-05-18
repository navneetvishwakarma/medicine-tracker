import { AlertTriangle, ChevronRight, X } from 'lucide-react'
import { useState } from 'react'
import type { DoseLog } from '@/types'

interface Props {
  missedLogs: DoseLog[]
  onAction: (log: DoseLog, status: 'taken' | 'skipped') => void
  onDismiss: () => void
  getMedicineName: (id: string) => string
}

export default function MissedDoseBanner({
  missedLogs,
  onAction,
  onDismiss,
  getMedicineName,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false)

  if (missedLogs.length === 0) return null

  // Show up to 2 medicine names in the banner preview
  const uniqueMedicines = [...new Set(missedLogs.map((l) => getMedicineName(l.medicineId)))]
  const previewNames =
    uniqueMedicines.slice(0, 2).join(', ') + (uniqueMedicines.length > 2 ? '…' : '')

  return (
    <>
      {/* Banner */}
      <div
        className="mx-4 mt-3 rounded-2xl overflow-hidden"
        style={{
          background: '#FFFBEB',
          border: '1px solid #FDE68A',
          boxShadow: '0 1px 3px rgba(217,119,6,0.08)',
        }}
      >
        <div
          className="flex items-center gap-3 px-4 py-3 cursor-pointer"
          onClick={() => setSheetOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setSheetOpen(true)
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="View missed doses"
        >
          <AlertTriangle size={16} className="text-amber-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-amber-800 leading-tight" style={{ fontSize: 14 }}>
              {missedLogs.length} missed dose{missedLogs.length > 1 ? 's' : ''}
            </p>
            <p className="text-amber-700 truncate mt-0.5" style={{ fontSize: 12 }}>
              {previewNames}
            </p>
          </div>
          <ChevronRight size={15} className="text-amber-500 shrink-0" />
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDismiss()
            }}
            className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-500 transition-colors shrink-0"
            aria-label="Dismiss banner"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Bottom sheet */}
      {sheetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          style={{ backdropFilter: 'blur(2px)' }}
          onClick={() => setSheetOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-3xl max-h-[75dvh] flex flex-col"
            style={{ boxShadow: '0 -8px 32px rgba(28,28,26,0.16)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-9 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Sheet header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <p className="font-bold text-gray-900" style={{ fontSize: 17 }}>
                Missed doses
              </p>
              <button
                onClick={() => setSheetOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Dose list */}
            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
              {missedLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate" style={{ fontSize: 14 }}>
                      {getMedicineName(log.medicineId)}
                    </p>
                    <p className="text-gray-500 mt-0.5 capitalize" style={{ fontSize: 12 }}>
                      {log.scheduledDate} · {log.scheduledTime}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => onAction(log, 'taken')}
                      className="bg-green-100 text-green-700 border border-green-200 rounded-full px-3 py-1.5 font-semibold transition-colors hover:bg-green-200"
                      style={{ fontSize: 12 }}
                    >
                      Taken
                    </button>
                    <button
                      onClick={() => onAction(log, 'skipped')}
                      className="bg-red-50 text-red-600 border border-red-200 rounded-full px-3 py-1.5 font-semibold transition-colors hover:bg-red-100"
                      style={{ fontSize: 12 }}
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
