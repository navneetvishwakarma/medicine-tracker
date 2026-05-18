import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

// Mock supabase before importing anything that uses it
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithOAuth: vi.fn().mockResolvedValue({ data: null, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}))

import { AuthProvider } from '@/context/AuthContext'
import AuthPage from '@/pages/Auth'

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      <AuthProvider>{children}</AuthProvider>
    </MemoryRouter>
  )
}

describe('AuthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders sign-in form by default', () => {
    render(<Wrapper><AuthPage /></Wrapper>)
    expect(screen.getByRole('heading', { name: /^sign in$/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument()
  })

  it('switches to sign-up form when tab is clicked', async () => {
    const user = userEvent.setup()
    render(<Wrapper><AuthPage /></Wrapper>)
    await user.click(screen.getByRole('button', { name: /^create account$/i }))
    expect(screen.getByRole('heading', { name: /^create account$/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
  })

  it('shows error when submitting empty sign-in form', async () => {
    const user = userEvent.setup()
    render(<Wrapper><AuthPage /></Wrapper>)
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument()
  })

  it('shows error when passwords do not match on sign-up', async () => {
    const user = userEvent.setup()
    render(<Wrapper><AuthPage /></Wrapper>)
    await user.click(screen.getByRole('button', { name: /create account/i }))
    await user.type(screen.getByLabelText(/^email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'different123')
    await user.click(screen.getByRole('button', { name: /create account/i }))
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument()
  })

  it('calls signInWithPassword with credentials on sign-in submit', async () => {
    const { supabase } = await import('@/lib/supabase')
    const user = userEvent.setup()
    render(<Wrapper><AuthPage /></Wrapper>)
    await user.type(screen.getByLabelText(/^email$/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))
    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  it('renders Google sign-in button', () => {
    render(<Wrapper><AuthPage /></Wrapper>)
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument()
  })
})
