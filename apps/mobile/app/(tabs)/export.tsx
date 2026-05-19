import { format, subDays } from 'date-fns'
import { useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { buildGridData } from '@medicine-tracker/core'
import { useMedicines } from '@medicine-tracker/core'
import { useDoseLogsForRange } from '@medicine-tracker/core'

export default function ExportScreen() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const weekAgo = format(subDays(new Date(), 6), 'yyyy-MM-dd')
  const [from] = useState(weekAgo)
  const [to] = useState(today)

  const { data: medicines = [] } = useMedicines()
  const { data: logs = [] } = useDoseLogsForRange(from, to)

  const grid = buildGridData(medicines, logs, { from, to })

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Export</Text>
      <Text style={styles.subtitle}>{from} → {to}</Text>

      {grid.length === 0 ? (
        <Text style={styles.empty}>No data for this period.</Text>
      ) : (
        <ScrollView horizontal>
          <View>
            {grid.map((row, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.medName}>{row.medicineName}</Text>
                <Text style={styles.dosage}>{row.dosage}</Text>
                {Object.values(row.cells).map((cell, j) => (
                  <View
                    key={j}
                    style={[
                      styles.cell,
                      cell === 'T' && styles.cellTaken,
                      cell === 'S' && styles.cellSkipped,
                    ]}
                  >
                    <Text style={styles.cellText}>{cell}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      <Text style={styles.note}>
        PDF and Excel export available in the web app.
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#6b7280', marginBottom: 16 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 48, fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  medName: { width: 100, fontSize: 12, fontWeight: '600', color: '#374151' },
  dosage: { width: 60, fontSize: 11, color: '#6b7280' },
  cell: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 6, marginHorizontal: 1, backgroundColor: '#f3f4f6' },
  cellTaken: { backgroundColor: '#dcfce7' },
  cellSkipped: { backgroundColor: '#fef2f2' },
  cellText: { fontSize: 11, fontWeight: '700', color: '#374151' },
  note: { marginTop: 24, fontSize: 13, color: '#9ca3af', textAlign: 'center', fontStyle: 'italic' },
})
