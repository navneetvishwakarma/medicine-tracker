import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RepositoryProvider } from '@/context/RepositoryContext'
import Today from '@/pages/Today'
import Medicines from '@/pages/Medicines'
import SettingsPage from '@/pages/Settings'
import ExportPage from '@/pages/Export'

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <RepositoryProvider>
        <MemoryRouter>{children}</MemoryRouter>
      </RepositoryProvider>
    </QueryClientProvider>
  )
}

describe('Scaffold smoke tests', () => {
  it('renders Today page without crashing', () => {
    render(<Wrapper><Today /></Wrapper>)
    expect(screen.getByText('Today')).toBeInTheDocument()
  })

  it('renders Medicines page without crashing', () => {
    render(<Wrapper><Medicines /></Wrapper>)
    expect(screen.getByText('Medicines')).toBeInTheDocument()
  })

  it('renders Settings page without crashing', () => {
    render(<Wrapper><SettingsPage /></Wrapper>)
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders Export page without crashing', () => {
    render(<Wrapper><ExportPage /></Wrapper>)
    expect(screen.getByText('Export')).toBeInTheDocument()
  })
})
