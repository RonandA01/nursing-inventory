import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Toaster } from '@/components/ui/toaster'

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
      <Toaster />
    </div>
  )
}
