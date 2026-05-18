import { format, subDays } from 'date-fns'
import { Download, FileSpreadsheet } from 'lucide-react'
import { useState } from 'react'
import { buildGridData } from '@/domain/export'
import { useDoseLogsForRange } from '@/hooks/useDoseLogs'
import { useMedicines } from '@/hooks/useMedicines'
import { useSettings } from '@/hooks/useSettings'
import { downloadExcel, downloadPDF } from '@/services/export'
import { useUIStore } from '@/store/useUIStore'

const today = () => format(new Date(), 'yyyy-MM-dd')
const daysAgo = (n: number) => format(subDays(new Date(), n), 'yyyy-MM-dd')
const MAX_DAYS = 14

export default function Export() {
  const [from, setFrom] = useState(daysAgo(6))
  const [to, setTo] = useState(today())
  const [rangeError, setRangeError] = useState('')

  const { data: medicines = [] } = useMedicines()
  const { data: settings } = useSettings()
  const { data: logs = [] } = useDoseLogsForRange(from, to)
  const { addToast } = useUIStore()

  const validateRange = (f: string, t: string) => {
    const days = (new Date(t).getTime() - new Date(f).getTime()) / 86400000 + 1
    if (days < 1) return 'End date must be after start date'
    if (days > MAX_DAYS) return `Maximum range is ${MAX_DAYS} days`
    return ''
  }

  const handleFromChange = (v: string) => { setFrom(v); setRangeError(validateRange(v, to)) }
  const handleToChange = (v: string) => { setTo(v); setRangeError(validateRange(from, v)) }

  const gridRows = buildGridData(medicines, logs, { from, to })
  const patientName = settings?.patientName ?? 'Patient'
  const canExport = !rangeError && medicines.length > 0
  const dayCount = Object.keys(gridRows[0]?.cells ?? {}).length

  const handlePDF = () => {
    try {
      downloadPDF(gridRows, patientName, { from, to })
    } catch {
      addToast('PDF export failed', 'error')
    }
  }

  const handleExcel = () => {
    try {
      downloadExcel(medicines, logs, gridRows, patientName, { from, to })
    } catch {
      addToast('Excel export failed', 'error')
    }
  }

  const SectionHeader = ({ children }: { children: React.ReactNode }) => (
    <p
      className="font-bold text-gray-400 uppercase tracking-widest px-1 mb-2"
      style={{ fontSize: 11 }}
    >
      {children}
    </p>
  )

  return (
    <main className="p-4 pb-10">
      <h1 className="font-bold text-gray-900 mb-6" style={{ fontSize: 24 }}>
        Export
      </h1>

      {/* Date range */}
      <section className="mb-6">
        <SectionHeader>Date range</SectionHeader>
        <div
          className="bg-white rounded-2xl p-4"
          style={{ boxShadow: '0 1px 2px rgba(28,28,26,0.06)' }}
        >
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-gray-500 mb-1.5" style={{ fontSize: 13 }}>
                From
              </label>
              <input
                type="date"
                value={from}
                max={to}
                onChange={(e) => handleFromChange(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                style={{ fontSize: 14 }}
              />
            </div>
            <span className="text-gray-400 pb-2.5" style={{ fontSize: 18 }}>–</span>
            <div className="flex-1">
              <label className="block text-gray-500 mb-1.5" style={{ fontSize: 13 }}>
                To
              </label>
              <input
                type="date"
                value={to}
                max={today()}
                onChange={(e) => handleToChange(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                style={{ fontSize: 14 }}
              />
            </div>
          </div>
          {rangeError && (
            <p className="text-red-500 mt-2.5" style={{ fontSize: 13 }}>
              {rangeError}
            </p>
          )}
        </div>
      </section>

      {/* Preview */}
      <section className="mb-6">
        <SectionHeader>Summary</SectionHeader>
        <div
          className="bg-white rounded-2xl p-4"
          style={{ boxShadow: '0 1px 2px rgba(28,28,26,0.06)' }}
        >
          {medicines.length === 0 ? (
            <p className="text-gray-400" style={{ fontSize: 14 }}>
              No medicines configured yet.
            </p>
          ) : (
            <div className="flex gap-6">
              <div>
                <p className="font-bold text-gray-900" style={{ fontSize: 22 }}>
                  {gridRows.length}
                </p>
                <p className="text-gray-500" style={{ fontSize: 13 }}>
                  medicine{gridRows.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div>
                <p className="font-bold text-gray-900" style={{ fontSize: 22 }}>
                  {dayCount}
                </p>
                <p className="text-gray-500" style={{ fontSize: 13 }}>
                  day{dayCount !== 1 ? 's' : ''}
                </p>
              </div>
              <div>
                <p className="font-bold text-gray-900" style={{ fontSize: 22 }}>
                  {logs.filter((l) => l.status === 'taken').length}
                </p>
                <p className="text-gray-500" style={{ fontSize: 13 }}>
                  doses taken
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Download buttons */}
      <section>
        <SectionHeader>Download</SectionHeader>
        <div className="flex flex-col gap-3">
          <button
            disabled={!canExport}
            onClick={handlePDF}
            className="flex items-center justify-center gap-2.5 py-4 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors"
            style={{ fontSize: 15 }}
          >
            <Download size={18} strokeWidth={2} />
            Download PDF
          </button>
          <button
            disabled={!canExport}
            onClick={handleExcel}
            className="flex items-center justify-center gap-2.5 py-4 bg-white border border-gray-200 text-gray-700 rounded-2xl font-semibold hover:bg-gray-50 disabled:opacity-40 transition-colors"
            style={{ fontSize: 15, boxShadow: '0 1px 2px rgba(28,28,26,0.06)' }}
          >
            <FileSpreadsheet size={18} strokeWidth={2} className="text-green-600" />
            Download Excel
          </button>
        </div>
      </section>
    </main>
  )
}
