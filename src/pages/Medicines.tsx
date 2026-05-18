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
    <main className="p-4 pb-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Medicines</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      {isError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-4">
          Failed to load medicines. Please restart the app.
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && medicines.length === 0 && !isError && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">💊</p>
          <p className="font-medium text-gray-700">No medicines yet</p>
          <p className="text-sm text-gray-500 mt-1">Tap "Add" to add your first medicine.</p>
          <button
            onClick={openAdd}
            className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
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

      {archiveConfirmId && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => setArchiveConfirmId(null)}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-semibold text-gray-900 mb-1">Archive medicine?</p>
            <p className="text-sm text-gray-500 mb-5">
              It will no longer appear in daily tracking.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setArchiveConfirmId(null)}
                className="flex-1 py-2.5 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmArchive}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
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
