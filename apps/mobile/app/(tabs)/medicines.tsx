import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useMedicines, useArchiveMedicine } from '@medicine-tracker/core'
import type { Medicine } from '@medicine-tracker/core'

const COLOR_BG: Record<Medicine['color'], string> = {
  red: '#fef2f2',
  orange: '#fff7ed',
  yellow: '#fefce8',
  green: '#f0fdf4',
  teal: '#f0fdfa',
  blue: '#eff6ff',
  purple: '#faf5ff',
  pink: '#fdf2f8',
}

const COLOR_DOT: Record<Medicine['color'], string> = {
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#22c55e',
  teal: '#14b8a6',
  blue: '#3b82f6',
  purple: '#a855f7',
  pink: '#ec4899',
}

export default function MedicinesScreen() {
  const { data: medicines = [], isLoading } = useMedicines()
  const archiveMedicine = useArchiveMedicine()

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>Loading…</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Medicines</Text>

      {medicines.length === 0 && (
        <Text style={styles.empty}>No medicines added yet.</Text>
      )}

      {medicines.map((med) => (
        <View key={med.id} style={[styles.card, { backgroundColor: COLOR_BG[med.color] }]}>
          <View style={[styles.dot, { backgroundColor: COLOR_DOT[med.color] }]} />
          <View style={styles.info}>
            <Text style={styles.name}>{med.name}</Text>
            <Text style={styles.dosage}>{med.dosage}</Text>
          </View>
          <TouchableOpacity
            onPress={() => archiveMedicine.mutate(med.id)}
            style={styles.deleteBtn}
          >
            <Text style={styles.deleteText}>Archive</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loading: { color: '#6b7280' },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 16 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 48, fontSize: 15 },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 14, marginBottom: 10 },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#111827' },
  dosage: { fontSize: 13, color: '#6b7280' },
  deleteBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#fff', borderRadius: 10 },
  deleteText: { fontSize: 13, color: '#6b7280' },
})
