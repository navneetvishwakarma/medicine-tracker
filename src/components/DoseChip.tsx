import { Check, Minus, X } from 'lucide-react'
import { useRef } from 'react'
import type { DoseLog, DoseStatus, TimeSlot } from '@/types'

interface Props {
  slot: TimeSlot
  log: DoseLog | null
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
  pending: 'bg-gray-100 text-gray-500 border-gray-200',
  taken: 'bg-green-100 text-green-700 border-green-300',
  skipped: 'bg-red-100 text-red-600 border-red-300',
}

const STATUS_ICON: Record<DoseStatus, React.ReactNode> = {
  pending: <Minus size={12} />,
  taken: <Check size={12} />,
  skipped: <X size={12} />,
}

export default function DoseChip({ slot, log, onTap, onLongPress }: Props) {
  const status: DoseStatus = log?.status ?? 'pending'
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handlePointerDown = () => {
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      onLongPress()
    }, 500)
  }

  const handlePointerUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
      onTap()
    }
  }

  const handlePointerLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  return (
    <button
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerLeave}
      className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl border text-xs font-medium gap-1 select-none transition-colors ${STATUS_STYLES[status]}`}
      aria-label={`${SLOT_LABEL[slot]}: ${status}`}
      data-testid={`dose-chip-${slot}`}
    >
      {STATUS_ICON[status]}
      <span>{SLOT_LABEL[slot]}</span>
    </button>
  )
}
