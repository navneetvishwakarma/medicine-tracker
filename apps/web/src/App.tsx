import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CalendarDays, Download, Pill, Settings } from 'lucide-react'
import { createContext, useContext, useEffect, useState } from 'react'
import { NavLink, Navigate, Outlet, RouterProvider, createBrowserRouter, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { RepositoryProvider, useRepositories } from '@/context/RepositoryContext'
import { scheduleToday } from '@/services/notifications'
import ErrorBoundary from '@/components/ErrorBoundary'
import MigrationBanner from '@/components/MigrationBanner'
import ToastStack from '@/components/ToastStack'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { useRole, type Role } from '@/hooks/useRole'
import AuthPage from '@/pages/Auth'
import Export from '@/pages/Export'
import Join from '@/pages/Join'
import Medicines from '@/pages/Medicines'
import SettingsPage from '@/pages/Settings'
import Today from '@/pages/Today'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: Infinity, retry: false },
  },
})

// ── Role context ──────────────────────────────────────────────────────────────

const RoleContext = createContext<{ role: Role; ownerUserId: string | null }>({
  role: 'owner',
  ownerUserId: null,
})

export function useAppRole() {
  return useContext(RoleContext)
}

// ── Route guard for viewer-restricted pages ───────────────────────────────────

const VIEWER_BLOCKED = ['/medicines', '/settings', '/export']

function ViewerGuard({ children }: { children: React.ReactNode }) {
  const { role } = useAppRole()
  const location = useLocation()
  const { addToast } = useUIStore()

  if (role === 'viewer' && VIEWER_BLOCKED.some((p) => location.pathname.startsWith(p))) {
    addToast('View only — this page is not available', 'error')
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

// Import here to avoid circular reference in ViewerGuard
import { useUIStore } from '@/store/useUIStore'

const NAV_ITEMS = [
  { to: '/', label: 'Today', icon: CalendarDays, end: true },
  { to: '/medicines', label: 'Medicines', icon: Pill, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
  { to: '/export', label: 'Export', icon: Download, end: false },
]

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const [migrationDismissed, setMigrationDismissed] = useState(false)

  if (loading) {
    return (
      <div className="min-h-dvh bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!user) return <Navigate to="/auth" replace />

  return (
    <>
      {!migrationDismissed && (
        <MigrationBanner userId={user.id} onDismiss={() => setMigrationDismissed(true)} />
      )}
      {children}
    </>
  )
}

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

function RealtimeWatcher() {
  const { user } = useAuth()
  useRealtimeSync(user?.id ?? null, queryClient)
  return null
}

function AppLayout() {
  const { role } = useAppRole()
  const visibleNavItems = role === 'viewer'
    ? NAV_ITEMS.filter((i) => i.to === '/')
    : NAV_ITEMS

  return (
    <RequireAuth>
      <div className="flex flex-col min-h-dvh bg-gray-50">
        <NotificationScheduler />
        <OnlineStatusWatcher />
        <RealtimeWatcher />

        <div className="flex-1 overflow-y-auto pb-[60px]">
          <ErrorBoundary>
            <ViewerGuard>
              <Outlet />
            </ViewerGuard>
          </ErrorBoundary>
        </div>

        <nav
          className="fixed bottom-0 left-0 right-0 h-[60px] bg-white border-t border-gray-100 flex"
          style={{ boxShadow: '0 -1px 0 rgba(28,28,26,0.06)' }}
          role="navigation"
          aria-label="Main navigation"
        >
          {visibleNavItems.map(({ to, label, icon: Icon, end }) => (
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
    </RequireAuth>
  )
}

const router = createBrowserRouter([
  { path: '/auth', element: <AuthPage /> },
  { path: '/join', element: <Join /> },
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

function AppRoot() {
  const { user } = useAuth()
  const { role, ownerUserId } = useRole(user?.id ?? null)

  // Viewers read owner's data — pass ownerUserId so RepositoryProvider scopes correctly
  const repoUserId = role === 'viewer' ? (ownerUserId ?? user?.id) : user?.id

  return (
    <RoleContext.Provider value={{ role, ownerUserId }}>
      <RepositoryProvider userId={repoUserId}>
        <RouterProvider router={router} />
      </RepositoryProvider>
    </RoleContext.Provider>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoot />
      </AuthProvider>
    </QueryClientProvider>
  )
}
