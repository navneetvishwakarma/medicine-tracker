import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { redeemInviteCode } from '@/services/inviteCode'
import { useUIStore } from '@/store/useUIStore'

export default function Join() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { addToast } = useUIStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    try {
      await redeemInviteCode(code.trim(), user.id)
      addToast('Access granted — welcome!', 'success')
      navigate('/', { replace: true })
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Invalid code', 'error')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-sm">
        <h1 className="font-bold text-gray-900 mb-1" style={{ fontSize: 22 }}>
          Join as Viewer
        </h1>
        <p className="text-gray-500 mb-6" style={{ fontSize: 14 }}>
          Enter the 6-character invite code shared by the primary caretaker.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 font-mono text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Invite code"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full py-3 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            style={{ fontSize: 15 }}
          >
            {loading ? 'Joining…' : 'Join'}
          </button>
        </form>
      </div>
    </div>
  )
}
