import { format, subDays } from 'date-fns'
import { Download, FileSpreadsheet } from 'lucide-react'
import { useState } from 'react'
import { buildGridData } from '@/domain/export'
import { useDoseLogsForRange } from '@/hooks/useDoseLogs'
import { useMedicines } from '@/hooks/useMedicines'
import { useSettings } from '@/hooks/useSettings'
import { downloadExcel, downloadPDF } from '@/services/export'

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

  const validateRange = (f: string, t: string) => {
    const days = (new Date(t).getTime() - new Date(f).getTime()) / 86400000 + 1
    if (days < 1) return 'End date must be after start date'
    if (days > MAX_DAYS) return `Maximum range is ${MAX_DAYS} days`
    return ''
  }

  const handleFromChange = (v: string) => {
    setFrom(v)
    setRangeError(validateRange(v, to))
  }

  const handleToChange = (v: string) => {
    setTo(v)
    setRangeError(validateRange(from, v))
  }

  const gridRows = buildGridData(medicines, logs, { from, to })
  const patientName = settings?.patientName ?? 'Patient'
  const canExport = !rangeError && medicines.length > 0

  return (
    <main className="p-4 pb-8">
      <h1 className="text-xl font-semibold mb-4">Export</h1>

      {/* Date range */}
      <section className="bg-white rounded-xl border p-4 mb-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Date range</h2>
        <div className="flex gap-3 items-center">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => handleFromChange(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <span className="text-gray-400 pt-5">–</span>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={to}
              max={today()}
              onChange={(e) => handleToChange(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        {rangeError && <p className="text-red-500 text-xs">{rangeError}</p>}
      </section>

      {/* Preview */}
      <section className="bg-white rounded-xl border p-4 mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Preview</h2>
        {medicines.length === 0 ? (
          <p className="text-sm text-gray-400">No medicines configured.</p>
        ) : (
          <p className="text-sm text-gray-600">
            {gridRows.length} medicine{gridRows.length !== 1 ? 's' : ''} ×{' '}
            {Object.keys(gridRows[0]?.cells ?? {}).length} day
            {Object.keys(gridRows[0]?.cells ?? {}).length !== 1 ? 's' : ''}
          </p>
        )}
      </section>

      {/* Download buttons */}
      <div className="flex gap-3">
        <button
          disabled={!canExport}
          onClick={() => downloadPDF(gridRows, patientName, { from, to })}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          <Download size={18} />
          Download PDF
        </button>
        <button
          disabled={!canExport}
          onClick={() => downloadExcel(medicines, logs, gridRows, patientName, { from, to })}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50"
        >
          <FileSpreadsheet size={18} />
          Download Excel
        </button>
      </div>
    </main>
  )
}
