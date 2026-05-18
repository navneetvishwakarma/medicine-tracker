import { ScrollView, StyleSheet, Switch, Text, TextInput, View, TouchableOpacity } from 'react-native'
import { useSettings, useUpdateSettings } from '@medicine-tracker/core'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SettingsScreen() {
  const { data: settings } = useSettings()
  const update = useUpdateSettings()
  const [patientName, setPatientName] = useState(settings?.patientName ?? '')

  const handleSave = () => {
    update.mutate({ patientName })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Profile</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Patient name</Text>
          <TextInput
            value={patientName}
            onChangeText={setPatientName}
            style={styles.input}
            placeholder="Patient"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.fieldLabel}>Dose reminders</Text>
            <Switch
              value={settings?.notificationsEnabled ?? false}
              onValueChange={(val) => update.mutate({ notificationsEnabled: val })}
              trackColor={{ true: '#2563eb' }}
            />
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>Save settings</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 16 },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fieldLabel: { fontSize: 15, color: '#374151' },
  input: { fontSize: 15, color: '#111827', borderBottomWidth: 1, borderColor: '#e5e7eb', paddingVertical: 8, marginTop: 8 },
  saveBtn: { backgroundColor: '#2563eb', borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  signOutBtn: { borderRadius: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  signOutText: { color: '#6b7280', fontWeight: '600', fontSize: 15 },
})
