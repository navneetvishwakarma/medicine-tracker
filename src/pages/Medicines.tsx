import { Plus } from 'lucide-react'
import { useState } from 'react'
import MedicineCard from '@/components/MedicineCard'
import MedicineForm, { type FormValues as MedicineFormValues } from '@/components/MedicineForm'
import { useArchiveMedicine, useMedicines, useSaveMedicine } from '@/hooks/useMedicines'
import type { Medicine } from '@/types'

export default function Medicines() {
  const { data: medicines = [], isLoading, isError } = useMedicines()
  const save = useSaveMedicine()
  const archive = useArchiveMedicine()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Medicine | undefined>()
  const [archiveConfirmId, setArchiveConfirmId] = useState<string | null>(null)

  const openAdd = () => { setEditing(undefined); setFormOpen(true) }
  const openEdit = (med: Medicine) => { setEditing(med); setFormOpen(true) }
  const closeForm = () => setFormOpen(false)

  const handleSubmit = (values: MedicineFormValues, id?: string) => {
    const medicine: Medicine = {
      id: id ?? crypto.randomUUID(),
      name: values.name,
      dosage: values.dosage,
      mealRelation: values.mealRelation,
      color: values.color,
      notes: values.notes,
      schedules: values.schedules,
      active: true,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
    }
    save.mutate(medicine, { onSuccess: closeForm })
  }

  const confirmArchive = () => {
    if (archiveConfirmId) {
      archive.mutate(archiveConfirmId, { onSuccess: () => setArchiveConfirmId(null) })
    }
  }

  return (
    <main className="p-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-bold text-gray-900" style={{ fontSize: 24 }}>
          Medicines
        </h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-2xl font-semibold hover:bg-blue-700 transition-colors"
          style={{ fontSize: 14 }}
        >
          <Plus size={16} strokeWidth={2.5} />
          Add
        </button>
      </div>

      {isError && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 mb-4">
          Failed to load medicines. Please restart the app.
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[76px] bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && !isError && medicines.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-5xl mb-5">💊</p>
          <p className="font-semibold text-gray-800" style={{ fontSize: 18 }}>
            No medicines yet
          </p>
          <p className="text-gray-500 mt-2" style={{ fontSize: 14 }}>
            Tap "Add" to add your first medicine.
          </p>
          <button
            onClick={openAdd}
            className="mt-6 bg-blue-600 text-white px-6 py-2.5 rounded-2xl font-semibold hover:bg-blue-700 transition-colors"
            style={{ fontSize: 14 }}
          >
            Add medicine
          </button>
        </div>
      )}

      {!isLoading && medicines.length > 0 && (
        <div className="space-y-3">
          {medicines.map((med) => (
            <MedicineCard
              key={med.id}
              medicine={med}
              onEdit={openEdit}
              onArchive={setArchiveConfirmId}
            />
          ))}
        </div>
      )}

      {formOpen && (
        <MedicineForm
          initial={editing}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      )}

      {/* Archive confirmation bottom sheet */}
      {archiveConfirmId && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          style={{ backdropFilter: 'blur(2px)' }}
          onClick={() => setArchiveConfirmId(null)}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-3xl pb-10"
            style={{ boxShadow: '0 -8px 32px rgba(28,28,26,0.16)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-9 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="px-6 pt-4 pb-6">
              <p className="font-bold text-gray-900" style={{ fontSize: 17 }}>
                Archive medicine?
              </p>
              <p className="text-gray-500 mt-1.5" style={{ fontSize: 14 }}>
                It will no longer appear in daily tracking. Dose history is preserved.
              </p>
            </div>
            <div className="flex gap-3 px-4">
              <button
                onClick={() => setArchiveConfirmId(null)}
                className="flex-1 py-3 border border-gray-200 rounded-2xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                style={{ fontSize: 15 }}
              >
                Cancel
              </button>
              <button
                onClick={confirmArchive}
                className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-semibold hover:bg-red-700 transition-colors"
                style={{ fontSize: 15 }}
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
