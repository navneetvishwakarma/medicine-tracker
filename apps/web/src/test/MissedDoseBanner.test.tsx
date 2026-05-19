import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import MissedDoseBanner from '@/components/MissedDoseBanner'
import type { DoseLog } from '@/types'

function makeLog(overrides: Partial<DoseLog> = {}): DoseLog {
  return {
    id: crypto.randomUUID(),
    medicineId: 'med-1',
    scheduledDate: '2026-05-17',
    scheduledTime: 'morning',
    status: 'pending',
    ...overrides,
  }
}

const getName = (id: string) => (id === 'med-1' ? 'Aspirin' : 'Unknown')

describe('MissedDoseBanner', () => {
  it('renders nothing when missedLogs is empty', () => {
    const { container } = render(
      <MissedDoseBanner missedLogs={[]} onAction={vi.fn()} onDismiss={vi.fn()} getMedicineName={getName} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows missed count in banner', () => {
    render(
      <MissedDoseBanner
        missedLogs={[makeLog(), makeLog({ id: crypto.randomUUID() })]}
        onAction={vi.fn()}
        onDismiss={vi.fn()}
        getMedicineName={getName}
      />,
    )
    expect(screen.getByText(/2 missed doses/i)).toBeInTheDocument()
  })

  it('opens sheet on banner click', () => {
    render(
      <MissedDoseBanner
        missedLogs={[makeLog()]}
        onAction={vi.fn()}
        onDismiss={vi.fn()}
        getMedicineName={getName}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /view missed/i }))
    expect(screen.getByText('Missed doses')).toBeInTheDocument()
    // Banner now shows medicine name in preview AND in the sheet — both are correct
    expect(screen.getAllByText('Aspirin').length).toBeGreaterThanOrEqual(1)
  })

  it('calls onAction with "taken" when Taken is clicked', () => {
    const onAction = vi.fn()
    const log = makeLog()
    render(
      <MissedDoseBanner
        missedLogs={[log]}
        onAction={onAction}
        onDismiss={vi.fn()}
        getMedicineName={getName}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /view missed/i }))
    fireEvent.click(screen.getByRole('button', { name: /^taken$/i }))
    expect(onAction).toHaveBeenCalledWith(log, 'taken')
  })

  it('calls onDismiss when X on banner is clicked', () => {
    const onDismiss = vi.fn()
    render(
      <MissedDoseBanner
        missedLogs={[makeLog()]}
        onAction={vi.fn()}
        onDismiss={onDismiss}
        getMedicineName={getName}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /dismiss banner/i }))
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
