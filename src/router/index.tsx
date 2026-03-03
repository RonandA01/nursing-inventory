import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { useAuthStore } from '@/stores/authStore'

// Pages
import { LoginPage } from '@/pages/LoginPage'
import { BorrowPage } from '@/pages/BorrowPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ReturnsPage } from '@/pages/ReturnsPage'
import { TransactionsPage } from '@/pages/TransactionsPage'
import { BorrowersPage } from '@/pages/BorrowersPage'
import { InventoryPage } from '@/pages/InventoryPage'
import { ProceduresPage } from '@/pages/ProceduresPage'
import { CategoriesPage } from '@/pages/CategoriesPage'
import { DepartmentsPage } from '@/pages/DepartmentsPage'
import { StaffPage } from '@/pages/StaffPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { SettingsPage } from '@/pages/SettingsPage'

function RequireAuth() {
  const { session, loading } = useAuthStore()
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}

function RequireAdmin() {
  const { profile, loading } = useAuthStore()
  if (loading) return null
  if (profile?.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <Outlet />
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/borrow" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <PublicLayout />,
    children: [
      { path: '/borrow', element: <BorrowPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/returns', element: <ReturnsPage /> },
          { path: '/transactions', element: <TransactionsPage /> },
          { path: '/borrowers', element: <BorrowersPage /> },
          {
            element: <RequireAdmin />,
            children: [
              { path: '/inventory', element: <InventoryPage /> },
              { path: '/procedures', element: <ProceduresPage /> },
              { path: '/categories', element: <CategoriesPage /> },
              { path: '/departments', element: <DepartmentsPage /> },
              { path: '/staff', element: <StaffPage /> },
              { path: '/reports', element: <ReportsPage /> },
              { path: '/settings', element: <SettingsPage /> },
            ],
          },
        ],
      },
    ],
  },
])
