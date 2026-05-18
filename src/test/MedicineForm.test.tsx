import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RepositoryProvider } from '@/context/RepositoryContext'
import MedicineForm from '@/components/MedicineForm'

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <RepositoryProvider>{children}</RepositoryProvider>
    </QueryClientProvider>
  )
}

describe('MedicineForm', () => {
  it('renders add form with empty fields', () => {
    render(
      <Wrapper>
        <MedicineForm onSubmit={vi.fn()} onCancel={vi.fn()} />
      </Wrapper>,
    )
    expect(screen.getByText('Add Medicine')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/BRILINTA/i)).toBeInTheDocument()
  })

  it('shows validation error when name is empty', async () => {
    const user = userEvent.setup()
    render(
      <Wrapper>
        <MedicineForm onSubmit={vi.fn()} onCancel={vi.fn()} />
      </Wrapper>,
    )
    await user.click(screen.getByRole('button', { name: /add medicine/i }))
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument()
    })
  })

  it('shows validation error when no slot selected', async () => {
    const user = userEvent.setup()
    render(
      <Wrapper>
        <MedicineForm onSubmit={vi.fn()} onCancel={vi.fn()} />
      </Wrapper>,
    )
    await user.type(screen.getByPlaceholderText(/BRILINTA/i), 'Test Med')
    await user.type(screen.getByPlaceholderText(/90mg/i), '10mg')
    await user.click(screen.getByRole('button', { name: /add medicine/i }))
    await waitFor(() => {
      expect(screen.getByText(/at least one time slot/i)).toBeInTheDocument()
    })
  })

  it('calls onSubmit with correct data when form is valid', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <Wrapper>
        <MedicineForm onSubmit={onSubmit} onCancel={vi.fn()} />
      </Wrapper>,
    )
    await user.type(screen.getByPlaceholderText(/BRILINTA/i), 'Aspirin')
    await user.type(screen.getByPlaceholderText(/90mg/i), '75mg')
    // select Morning slot
    await user.click(screen.getByRole('button', { name: /^Morning$/i }))
    await user.click(screen.getByRole('button', { name: /add medicine/i }))
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledOnce()
      const [values] = onSubmit.mock.calls[0]
      expect(values.name).toBe('Aspirin')
      expect(values.dosage).toBe('75mg')
      expect(values.schedules).toHaveLength(1)
      expect(values.schedules[0].time).toBe('morning')
    })
  })

  it('calls onCancel when Cancel is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(
      <Wrapper>
        <MedicineForm onSubmit={vi.fn()} onCancel={onCancel} />
      </Wrapper>,
    )
    await user.click(screen.getByRole('button', { name: /^cancel$/i }))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('pre-fills form when editing an existing medicine', () => {
    const med = {
      id: crypto.randomUUID(),
      name: 'BRILINTA',
      dosage: '90mg',
      mealRelation: 'after' as const,
      schedules: [{ time: 'morning' as const, hour: 8, minute: 0 }],
      color: 'blue' as const,
      active: true,
      createdAt: new Date().toISOString(),
    }
    render(
      <Wrapper>
        <MedicineForm initial={med} onSubmit={vi.fn()} onCancel={vi.fn()} />
      </Wrapper>,
    )
    expect(screen.getByText('Edit Medicine')).toBeInTheDocument()
    expect(screen.getByDisplayValue('BRILINTA')).toBeInTheDocument()
    expect(screen.getByDisplayValue('90mg')).toBeInTheDocument()
  })

  it('closes via X button', async () => {
    const onCancel = vi.fn()
    render(
      <Wrapper>
        <MedicineForm onSubmit={vi.fn()} onCancel={onCancel} />
      </Wrapper>,
    )
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
