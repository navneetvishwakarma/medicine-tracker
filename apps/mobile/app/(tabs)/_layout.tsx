import { Tabs } from 'expo-router'
import { CalendarDays, Download, Pill, Settings } from 'lucide-react-native'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { borderTopColor: '#f3f4f6' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => <CalendarDays size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="medicines"
        options={{
          title: 'Medicines',
          tabBarIcon: ({ color, size }) => <Pill size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="export"
        options={{
          title: 'Export',
          tabBarIcon: ({ color, size }) => <Download size={size} color={color} />,
        }}
      />
    </Tabs>
  )
}
