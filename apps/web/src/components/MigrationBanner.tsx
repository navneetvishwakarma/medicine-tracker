import { useEffect, useState } from 'react'
import { detectLocalData, migrateToSupabase, type LocalDataSummary } from '@/services/migration'
import { useUIStore } from '@/store/useUIStore'

interface Props {
  userId: string
  onDismiss: () => void
}

export default function MigrationBanner({ userId, onDismiss }: Props) {
  const [summary, setSummary] = useState<LocalDataSummary | null>(null)
  const [migrating, setMigrating] = useState(false)
  const { addToast } = useUIStore()

  useEffect(() => {
    detectLocalData().then((s) => {
      if (s.medicines > 0 || s.logs > 0) setSummary(s)
    })
  }, [])

  if (!summary) return null

  const handleImport = async () => {
    setMigrating(true)
    try {
      await migrateToSupabase(userId)
      addToast(`Imported ${summary.medicines} medicines and ${summary.logs} dose logs`, 'success')
      onDismiss()
    } catch {
      addToast('Migration failed — please try again', 'error')
      setMigrating(false)
    }
  }

  const medLabel = `${summary.medicines} medicine${summary.medicines !== 1 ? 's' : ''}`
  const logLabel = `${summary.logs} dose log${summary.logs !== 1 ? 's' : ''}`

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mx-4 mt-4">
      <p className="font-semibold text-amber-900 mb-1" style={{ fontSize: 14 }}>
        Import your local data
      </p>
      <p className="text-amber-700 mb-3" style={{ fontSize: 13 }}>
        Found {medLabel} and {logLabel} saved on this device. Import them to your cloud account?
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleImport}
          disabled={migrating}
          className="px-4 py-2 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 disabled:opacity-50 transition-colors"
          style={{ fontSize: 13 }}
        >
          {migrating ? 'Importing…' : 'Import'}
        </button>
        <button
          onClick={onDismiss}
          disabled={migrating}
          className="px-4 py-2 bg-white border border-amber-200 text-amber-700 rounded-xl font-semibold hover:bg-amber-50 disabled:opacity-50 transition-colors"
          style={{ fontSize: 13 }}
        >
          Skip
        </button>
      </div>
    </div>
  )
}
