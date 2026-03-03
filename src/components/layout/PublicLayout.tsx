import { Outlet } from 'react-router-dom'
import { Stethoscope } from 'lucide-react'
import { Toaster } from '@/components/ui/toaster'

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <header className="bg-white border-b border-green-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-green-900 leading-none text-sm">NurseTrack</p>
            <p className="text-xs text-green-600">Equipment Inventory System</p>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Outlet />
      </main>
      <Toaster />
    </div>
  )
}
