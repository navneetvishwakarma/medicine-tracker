import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CalendarDays, Download, Pill, Settings } from 'lucide-react'
import { useEffect } from 'react'
import { NavLink, Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom'
import { RepositoryProvider, useRepositories } from '@/context/RepositoryContext'
import { scheduleToday } from '@/services/notifications'
import ErrorBoundary from '@/components/ErrorBoundary'
import ToastStack from '@/components/ToastStack'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import Export from '@/pages/Export'
import Medicines from '@/pages/Medicines'
import SettingsPage from '@/pages/Settings'
import Today from '@/pages/Today'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: Infinity, retry: false },
  },
})

const NAV_ITEMS = [
  { to: '/', label: 'Today', icon: CalendarDays, end: true },
  { to: '/medicines', label: 'Medicines', icon: Pill, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
  { to: '/export', label: 'Export', icon: Download, end: false },
]

function NotificationScheduler() {
  const { medicines, settings } = useRepositories()
  useEffect(() => {
    const reschedule = async () => {
      const [meds, cfg] = await Promise.all([medicines.getAll(), settings.get()])
      scheduleToday(meds, cfg)
    }
    reschedule()
    const onVisible = () => { if (document.visibilityState === 'visible') reschedule() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [medicines, settings])
  return null
}

function OnlineStatusWatcher() {
  useOnlineStatus()
  return null
}

function AppLayout() {
  return (
    <div className="flex flex-col min-h-dvh bg-gray-50">
      <NotificationScheduler />
      <OnlineStatusWatcher />
      <div className="flex-1 overflow-y-auto pb-20">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </div>
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex"
        role="navigation"
        aria-label="Main navigation"
      >
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'
              }`
            }
          >
            <Icon size={20} strokeWidth={1.75} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <ToastStack />
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Today /> },
      { path: 'medicines', element: <Medicines /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'export', element: <Export /> },
    ],
  },
])

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RepositoryProvider>
        <RouterProvider router={router} />
      </RepositoryProvider>
    </QueryClientProvider>
  )
}
