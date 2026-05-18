import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CalendarDays, Download, Pill, Settings } from 'lucide-react'
import { NavLink, Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom'
import { RepositoryProvider } from '@/context/RepositoryContext'
import Export from '@/pages/Export'
import Medicines from '@/pages/Medicines'
import SettingsPage from '@/pages/Settings'
import Today from '@/pages/Today'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60, retry: false },
  },
})

const NAV_ITEMS = [
  { to: '/', label: 'Today', icon: CalendarDays, end: true },
  { to: '/medicines', label: 'Medicines', icon: Pill, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
  { to: '/export', label: 'Export', icon: Download, end: false },
]

function AppLayout() {
  return (
    <div className="flex flex-col min-h-dvh bg-gray-50">
      <div className="flex-1 overflow-y-auto pb-20">
        <Outlet />
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
