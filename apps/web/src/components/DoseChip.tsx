import { Check, Minus, X } from 'lucide-react'
import { useRef } from 'react'
import type { DoseLog, DoseStatus, TimeSlot } from '@/types'

interface Props {
  slot: TimeSlot
  log: DoseLog | null
  hour?: number
  minute?: number
  isCurrent?: boolean
  onTap: () => void
  onLongPress: () => void
}

const SLOT_LABEL: Record<TimeSlot, string> = {
  morning: 'AM',
  noon: 'Noon',
  evening: 'PM',
  night: 'Night',
}

const STATUS_STYLES: Record<DoseStatus, string> = {
  pending: 'bg-gray-100 text-gray-500 border border-gray-200',
  taken: 'bg-green-100 text-green-700 border border-green-200',
  skipped: 'bg-red-50 text-red-600 border border-red-200',
}

const STATUS_ICON: Record<DoseStatus, React.ReactNode> = {
  pending: <Minus size={13} strokeWidth={2} />,
  taken: <Check size={13} strokeWidth={2.5} />,
  skipped: <X size={13} strokeWidth={2.5} />,
}

function formatTime(hour?: number, minute?: number): string | null {
  if (hour === undefined) return null
  const h12 = hour % 12 || 12
  const period = hour >= 12 ? 'PM' : 'AM'
  const m = minute ?? 0
  return m === 0 ? `${h12} ${period}` : `${h12}:${String(m).padStart(2, '0')} ${period}`
}

export default function DoseChip({
  slot,
  log,
  hour,
  minute,
  isCurrent = false,
  onTap,
  onLongPress,
}: Props) {
  const status: DoseStatus = log?.status ?? 'pending'
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timeLabel = formatTime(hour, minute)

  const handlePointerDown = () => {
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      onLongPress()
    }, 480)
  }
  const handlePointerUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
      onTap()
    }
  }
  const handlePointerCancel = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  return (
    <button
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerCancel}
      onPointerCancel={handlePointerCancel}
      className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl gap-1 select-none transition-colors ${STATUS_STYLES[status]} ${
        isCurrent ? 'ring-2 ring-blue-500 ring-offset-1' : ''
      }`}
      aria-label={`${SLOT_LABEL[slot]}: ${status}`}
      data-testid={`dose-chip-${slot}`}
    >
      {STATUS_ICON[status]}
      <span className="font-semibold leading-none" style={{ fontSize: 11 }}>
        {SLOT_LABEL[slot]}
      </span>
      {timeLabel && (
        <span className="leading-none text-current opacity-70" style={{ fontSize: 9 }}>
          {timeLabel}
        </span>
      )}
    </button>
  )
}
