import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, PackageSearch, RotateCcw, Users, ClipboardList,
  Stethoscope, Tag, Building2, UserCog, Settings, FileBarChart, LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

const staffLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/returns', icon: RotateCcw, label: 'Process Returns' },
  { to: '/transactions', icon: ClipboardList, label: 'Transactions' },
  { to: '/borrowers', icon: Users, label: 'Borrowers' },
]

const adminLinks = [
  { to: '/inventory', icon: PackageSearch, label: 'Inventory' },
  { to: '/procedures', icon: Stethoscope, label: 'Procedures' },
  { to: '/categories', icon: Tag, label: 'Categories' },
  { to: '/departments', icon: Building2, label: 'Departments' },
  { to: '/staff', icon: UserCog, label: 'Staff Accounts' },
  { to: '/reports', icon: FileBarChart, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const { profile, signOut } = useAuth()
  const isAdmin = profile?.role === 'admin'

  return (
    <aside className="w-64 min-h-screen bg-sidebar text-sidebar-foreground flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-white leading-none">NurseTrack</p>
            <p className="text-xs text-sidebar-foreground/60 mt-0.5">Inventory System</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40 mb-2">
          Operations
        </p>
        {staffLinks.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-white font-medium'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40 mt-4 mb-2">
              Administration
            </p>
            {adminLinks.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-white font-medium'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  )
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-white text-xs font-bold">
            {profile?.full_name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{profile?.full_name ?? 'User'}</p>
            <p className="text-xs text-sidebar-foreground/50 capitalize">{profile?.role ?? ''}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-md transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
