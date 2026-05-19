import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ── Mock supabase ─────────────────────────────────────────────────────────────
const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}))

// ── Mock migration service ────────────────────────────────────────────────────
vi.mock('@/services/migration', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/migration')>()
  return {
    ...actual,
    detectLocalData: vi.fn(),
    migrateToSupabase: vi.fn(),
  }
})

import { detectLocalData, migrateToSupabase } from '@/services/migration'
import MigrationBanner from '@/components/MigrationBanner'

const mockDetectLocalData = vi.mocked(detectLocalData)
const mockMigrateToSupabase = vi.mocked(migrateToSupabase)

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('MigrationBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when no local data exists', async () => {
    mockDetectLocalData.mockResolvedValueOnce({ medicines: 0, logs: 0 })
    const { container } = render(
      <Wrapper>
        <MigrationBanner userId="user-1" onDismiss={vi.fn()} />
      </Wrapper>,
    )
    await waitFor(() => {
      expect(container.firstChild).toBeNull()
    })
  })

  it('shows migration prompt with correct counts when local data exists', async () => {
    mockDetectLocalData.mockResolvedValueOnce({ medicines: 3, logs: 42 })
    render(
      <Wrapper>
        <MigrationBanner userId="user-1" onDismiss={vi.fn()} />
      </Wrapper>,
    )
    expect(await screen.findByText(/3 medicines/i)).toBeInTheDocument()
    expect(await screen.findByText(/42 dose logs/i)).toBeInTheDocument()
  })

  it('calls migrateToSupabase and then onDismiss when Import is clicked', async () => {
    const onDismiss = vi.fn()
    mockDetectLocalData.mockResolvedValueOnce({ medicines: 2, logs: 10 })
    mockMigrateToSupabase.mockResolvedValueOnce(undefined)
    const user = userEvent.setup()
    render(
      <Wrapper>
        <MigrationBanner userId="user-1" onDismiss={onDismiss} />
      </Wrapper>,
    )
    await screen.findByText(/2 medicines/i)
    await user.click(screen.getByRole('button', { name: /import/i }))
    await waitFor(() => {
      expect(mockMigrateToSupabase).toHaveBeenCalledWith('user-1')
      expect(onDismiss).toHaveBeenCalled()
    })
  })

  it('calls onDismiss when Skip is clicked without migrating', async () => {
    const onDismiss = vi.fn()
    mockDetectLocalData.mockResolvedValueOnce({ medicines: 1, logs: 5 })
    const user = userEvent.setup()
    render(
      <Wrapper>
        <MigrationBanner userId="user-1" onDismiss={onDismiss} />
      </Wrapper>,
    )
    await screen.findByText(/1 medicine/i)
    await user.click(screen.getByRole('button', { name: /skip/i }))
    expect(onDismiss).toHaveBeenCalled()
    expect(mockMigrateToSupabase).not.toHaveBeenCalled()
  })
})
