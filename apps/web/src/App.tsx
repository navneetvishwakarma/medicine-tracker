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
    const onVisible = () => {
      if (document.visibilityState === 'visible') reschedule()
    }
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

      <div className="flex-1 overflow-y-auto pb-[60px]">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </div>

      {/* Bottom navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 h-[60px] bg-white border-t border-gray-100 flex"
        style={{ boxShadow: '0 -1px 0 rgba(28,28,26,0.06)' }}
        role="navigation"
        aria-label="Main navigation"
      >
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2 : 1.75}
                  className="transition-all"
                />
                <span
                  className="font-medium"
                  style={{ fontSize: 10, letterSpacing: '0.01em' }}
                >
                  {label}
                </span>
              </>
            )}
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
