import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

// ── Schemas ───────────────────────────────────────────────────────────────────

const SignInSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

const SignUpSchema = z
  .object({
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type SignInValues = z.infer<typeof SignInSchema>
type SignUpValues = z.infer<typeof SignUpSchema>

// ── Shared styles ─────────────────────────────────────────────────────────────

const inputClass =
  'w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow'

const labelClass = 'block font-medium text-gray-700 mb-1.5'

// ── Sign-in form ──────────────────────────────────────────────────────────────

function SignInForm({ onSwitch }: { onSwitch: () => void }) {
  const { signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({ resolver: zodResolver(SignInSchema) })

  const onSubmit = async (values: SignInValues) => {
    setServerError('')
    const { error } = await signIn(values.email, values.password)
    if (error) {
      setServerError(error.message)
    } else {
      navigate('/', { replace: true })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <h1 className="font-bold text-gray-900 mb-6" style={{ fontSize: 24 }}>
        Sign in
      </h1>

      <div>
        <label htmlFor="signin-email" className={labelClass} style={{ fontSize: 14 }}>
          Email
        </label>
        <input
          id="signin-email"
          type="email"
          autoComplete="email"
          {...register('email')}
          className={inputClass}
          style={{ fontSize: 15 }}
          aria-label="Email"
        />
        {errors.email && (
          <p className="text-red-500 mt-1.5" style={{ fontSize: 13 }}>{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="signin-password" className={labelClass} style={{ fontSize: 14 }}>
          Password
        </label>
        <input
          id="signin-password"
          type="password"
          autoComplete="current-password"
          {...register('password')}
          className={inputClass}
          style={{ fontSize: 15 }}
          aria-label="Password"
        />
        {errors.password && (
          <p className="text-red-500 mt-1.5" style={{ fontSize: 13 }}>{errors.password.message}</p>
        )}
      </div>

      {serverError && (
        <p className="text-red-500 text-center" style={{ fontSize: 13 }}>{serverError}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors"
        style={{ fontSize: 15 }}
      >
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>

      <div className="relative flex items-center gap-3 my-2">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-gray-400" style={{ fontSize: 13 }}>or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <button
        type="button"
        onClick={() => signInWithGoogle()}
        className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl font-semibold hover:bg-gray-50 transition-colors"
        style={{ fontSize: 15, boxShadow: '0 1px 2px rgba(28,28,26,0.06)' }}
      >
        Sign in with Google
      </button>

      <p className="text-center text-gray-500" style={{ fontSize: 14 }}>
        No account?{' '}
        <button
          type="button"
          onClick={onSwitch}
          className="text-blue-600 font-medium hover:underline"
        >
          Create account
        </button>
      </p>
    </form>
  )
}

// ── Sign-up form ──────────────────────────────────────────────────────────────

function SignUpForm({ onSwitch }: { onSwitch: () => void }) {
  const { signUp } = useAuth()
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({ resolver: zodResolver(SignUpSchema) })

  const onSubmit = async (values: SignUpValues) => {
    setServerError('')
    const { error } = await signUp(values.email, values.password)
    if (error) {
      setServerError(error.message)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <p className="text-2xl">📬</p>
        <p className="font-bold text-gray-900" style={{ fontSize: 18 }}>Check your email</p>
        <p className="text-gray-500" style={{ fontSize: 14 }}>
          We sent a confirmation link. Click it to activate your account, then sign in.
        </p>
        <button
          type="button"
          onClick={onSwitch}
          className="text-blue-600 font-medium hover:underline"
          style={{ fontSize: 14 }}
        >
          Back to sign in
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <h1 className="font-bold text-gray-900 mb-6" style={{ fontSize: 24 }}>
        Create account
      </h1>

      <div>
        <label htmlFor="signup-email" className={labelClass} style={{ fontSize: 14 }}>
          Email
        </label>
        <input
          id="signup-email"
          type="email"
          autoComplete="email"
          {...register('email')}
          className={inputClass}
          style={{ fontSize: 15 }}
          aria-label="Email"
        />
        {errors.email && (
          <p className="text-red-500 mt-1.5" style={{ fontSize: 13 }}>{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="signup-password" className={labelClass} style={{ fontSize: 14 }}>
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          {...register('password')}
          className={inputClass}
          style={{ fontSize: 15 }}
          aria-label="Password"
        />
        {errors.password && (
          <p className="text-red-500 mt-1.5" style={{ fontSize: 13 }}>{errors.password.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="signup-confirm" className={labelClass} style={{ fontSize: 14 }}>
          Confirm password
        </label>
        <input
          id="signup-confirm"
          type="password"
          autoComplete="new-password"
          {...register('confirmPassword')}
          className={inputClass}
          style={{ fontSize: 15 }}
          aria-label="Confirm password"
        />
        {errors.confirmPassword && (
          <p className="text-red-500 mt-1.5" style={{ fontSize: 13 }}>
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {serverError && (
        <p className="text-red-500 text-center" style={{ fontSize: 13 }}>{serverError}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors"
        style={{ fontSize: 15 }}
      >
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </button>

      <p className="text-center text-gray-500" style={{ fontSize: 14 }}>
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitch}
          className="text-blue-600 font-medium hover:underline"
        >
          Sign in
        </button>
      </p>
    </form>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  return (
    <div className="min-h-dvh bg-gray-50 flex items-center justify-center p-4">
      <div
        className="bg-white w-full max-w-sm rounded-3xl p-8"
        style={{ boxShadow: '0 4px 24px rgba(28,28,26,0.10)' }}
      >
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
            <span className="text-white text-2xl">💊</span>
          </div>
        </div>

        {mode === 'signin' ? (
          <SignInForm onSwitch={() => setMode('signup')} />
        ) : (
          <SignUpForm onSwitch={() => setMode('signin')} />
        )}
      </div>
    </div>
  )
}
