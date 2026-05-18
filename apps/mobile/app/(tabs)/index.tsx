import * as Haptics from 'expo-haptics'
import { format, isToday, parseISO } from 'date-fns'
import { useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import {
  getDailySlots,
  TIME_SLOTS,
  type DoseLog,
  type DoseSlot,
  type TimeSlot,
} from '@medicine-tracker/core'
import { useDoseLogsForDate, useUpsertDoseLog } from '@medicine-tracker/core'
import { useMedicines } from '@medicine-tracker/core'
import { useSettings } from '@medicine-tracker/core'

const SLOT_LABEL: Record<TimeSlot, string> = {
  morning: 'AM',
  noon: 'Noon',
  evening: 'PM',
  night: 'Night',
}

function DoseChip({
  doseSlot,
  onPress,
}: {
  doseSlot: DoseSlot
  onPress: () => void
}) {
  const status = doseSlot.log?.status ?? 'pending'
  const bgColor =
    status === 'taken'
      ? '#dcfce7'
      : status === 'skipped'
        ? '#fef2f2'
        : '#f3f4f6'
  const textColor =
    status === 'taken' ? '#15803d' : status === 'skipped' ? '#dc2626' : '#6b7280'

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, { backgroundColor: bgColor, borderColor: textColor + '33' }]}
      accessibilityLabel={`${SLOT_LABEL[doseSlot.scheduledTime]}: ${status}`}
    >
      <Text style={[styles.chipLabel, { color: textColor }]}>
        {SLOT_LABEL[doseSlot.scheduledTime]}
      </Text>
      <Text style={[styles.chipStatus, { color: textColor }]}>
        {status === 'taken' ? '✓' : status === 'skipped' ? '✕' : '–'}
      </Text>
    </TouchableOpacity>
  )
}

export default function TodayScreen() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [activeDate, setActiveDate] = useState(today)
  const { data: medicines = [] } = useMedicines()
  const { data: logs = [] } = useDoseLogsForDate(activeDate)
  const { data: settings } = useSettings()
  const upsert = useUpsertDoseLog()

  const slots = getDailySlots(medicines, activeDate, logs)

  const handleTap = async (slot: DoseSlot) => {
    const currentStatus = slot.log?.status ?? 'pending'
    const newStatus = currentStatus === 'taken' ? 'pending' : 'taken'

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    const log: DoseLog = slot.log
      ? { ...slot.log, status: newStatus, markedAt: newStatus === 'taken' ? new Date().toISOString() : undefined }
      : {
          id: Math.random().toString(36).slice(2),
          medicineId: slot.medicine.id,
          scheduledDate: slot.scheduledDate,
          scheduledTime: slot.scheduledTime,
          status: newStatus,
          markedAt: newStatus === 'taken' ? new Date().toISOString() : undefined,
        }
    upsert.mutate(log)
  }

  const slotGroups = TIME_SLOTS.map((slotName) => ({
    slotName,
    entries: slots.filter((s) => s.scheduledTime === slotName),
  })).filter((g) => g.entries.length > 0)

  const isTodayView = activeDate === today

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Date navigation */}
      <View style={styles.dateNav}>
        <Pressable onPress={() => {
          const d = new Date(activeDate)
          d.setDate(d.getDate() - 1)
          setActiveDate(format(d, 'yyyy-MM-dd'))
        }}>
          <Text style={styles.navArrow}>‹</Text>
        </Pressable>
        <Text style={styles.dateLabel}>
          {isTodayView ? 'Today' : format(parseISO(activeDate), 'MMM d')}
        </Text>
        <Pressable
          onPress={() => {
            if (!isTodayView) {
              const d = new Date(activeDate)
              d.setDate(d.getDate() + 1)
              setActiveDate(format(d, 'yyyy-MM-dd'))
            }
          }}
          disabled={isTodayView}
        >
          <Text style={[styles.navArrow, isTodayView && styles.navArrowDisabled]}>›</Text>
        </Pressable>
      </View>

      {slotGroups.length === 0 && (
        <Text style={styles.empty}>No medicines scheduled for this day.</Text>
      )}

      {slotGroups.map(({ slotName, entries }) => (
        <View key={slotName} style={styles.slotGroup}>
          <Text style={styles.slotHeader}>
            {slotName.charAt(0).toUpperCase() + slotName.slice(1)}
          </Text>
          {entries.map((doseSlot) => (
            <View key={`${doseSlot.medicine.id}-${doseSlot.scheduledTime}`} style={styles.row}>
              <View style={styles.medInfo}>
                <Text style={styles.medName}>{doseSlot.medicine.name}</Text>
                <Text style={styles.medDosage}>{doseSlot.medicine.dosage}</Text>
              </View>
              <DoseChip doseSlot={doseSlot} onPress={() => handleTap(doseSlot)} />
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, paddingBottom: 32 },
  dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  navArrow: { fontSize: 28, color: '#2563eb', paddingHorizontal: 12 },
  navArrowDisabled: { color: '#d1d5db' },
  dateLabel: { fontSize: 18, fontWeight: '700', color: '#111827' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 48, fontSize: 15 },
  slotGroup: { marginBottom: 20 },
  slotHeader: { fontSize: 13, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 12, marginBottom: 8 },
  medInfo: { flex: 1 },
  medName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  medDosage: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  chip: { width: 60, height: 60, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipLabel: { fontSize: 11, fontWeight: '700' },
  chipStatus: { fontSize: 14, fontWeight: '600' },
})
