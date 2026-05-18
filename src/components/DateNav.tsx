import { addDays, format, isToday, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  date: string // YYYY-MM-DD
  onChange: (date: string) => void
}

export default function DateNav({ date, onChange }: Props) {
  const parsed = parseISO(date)
  const isTodayDate = isToday(parsed)
  const label = isTodayDate ? 'Today' : format(parsed, 'MMM d')

  const prev = () => onChange(addDays(parsed, -1).toISOString().split('T')[0])
  const next = () => {
    if (!isTodayDate) onChange(addDays(parsed, 1).toISOString().split('T')[0])
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b sticky top-0 z-10">
      <button
        onClick={prev}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
        aria-label="Previous day"
      >
        <ChevronLeft size={20} />
      </button>
      <div className="text-center">
        <p className="font-semibold text-gray-900">{label}</p>
        {!isTodayDate && (
          <p className="text-xs text-gray-400">{format(parsed, 'EEEE, MMM d yyyy')}</p>
        )}
      </div>
      <button
        onClick={next}
        disabled={isTodayDate}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Next day"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  )
}
