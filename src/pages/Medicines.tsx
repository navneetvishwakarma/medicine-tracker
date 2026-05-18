import { Plus } from 'lucide-react'
import { useState } from 'react'
import MedicineCard from '@/components/MedicineCard'
import MedicineForm from '@/components/MedicineForm'
import { useArchiveMedicine, useMedicines, useSaveMedicine } from '@/hooks/useMedicines'
import type { Medicine } from '@/types'

export default function Medicines() {
  const { data: medicines = [], isLoading } = useMedicines()
  const save = useSaveMedicine()
  const archive = useArchiveMedicine()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Medicine | undefined>()

  const openAdd = () => { setEditing(undefined); setFormOpen(true) }
  const openEdit = (med: Medicine) => { setEditing(med); setFormOpen(true) }
  const closeForm = () => setFormOpen(false)

  const handleSubmit = (
    values: Parameters<typeof MedicineForm>[0]['onSubmit'] extends (v: infer V, id?: string) => void ? V : never,
    id?: string,
  ) => {
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

  const handleArchive = (id: string) => {
    if (confirm('Archive this medicine? It will no longer appear in daily tracking.')) {
      archive.mutate(id)
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

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && medicines.length === 0 && (
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
              onArchive={handleArchive}
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
    </main>
  )
}
