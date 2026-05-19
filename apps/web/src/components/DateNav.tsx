import { addDays, format, isToday, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  date: string // YYYY-MM-DD
  onChange: (date: string) => void
}

export default function DateNav({ date, onChange }: Props) {
  const parsed = parseISO(date)
  const isTodayDate = isToday(parsed)

  const prev = () => onChange(format(addDays(parsed, -1), 'yyyy-MM-dd'))
  const next = () => {
    if (!isTodayDate) onChange(format(addDays(parsed, 1), 'yyyy-MM-dd'))
  }

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-100 flex items-center px-1 py-2">
      <button
        onClick={prev}
        className="p-2.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
        aria-label="Previous day"
      >
        <ChevronLeft size={22} strokeWidth={2} />
      </button>

      <div className="flex-1 text-center">
        <p className="font-bold text-gray-900 leading-tight" style={{ fontSize: 17 }}>
          {isTodayDate ? 'Today' : format(parsed, 'EEEE')}
        </p>
        <p className="text-gray-400 leading-tight mt-0.5" style={{ fontSize: 12 }}>
          {isTodayDate ? format(parsed, 'MMMM d, yyyy') : format(parsed, 'MMMM d')}
        </p>
      </div>

      <button
        onClick={next}
        disabled={isTodayDate}
        className="p-2.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
        aria-label="Next day"
      >
        <ChevronRight size={22} strokeWidth={2} />
      </button>
    </div>
  )
}
