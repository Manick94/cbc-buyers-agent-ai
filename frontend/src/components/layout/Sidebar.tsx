import { NavLink } from 'react-router-dom'
import { Building2, MessageSquare, Users, BarChart3, Settings, Bot, Sun, Moon } from 'lucide-react'
import { useDarkMode } from '../../hooks/useDarkMode'

const navItems = [
  { to: '/chat', icon: MessageSquare, label: 'Live Session' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const { isDark, toggle } = useDarkMode()

  return (
    <aside className="w-56 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col h-full shrink-0 shadow-sm">
      <div className="p-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
            <Building2 size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">Buyers Agent</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 leading-tight">AI Companion</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={17}
                  className={isActive ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
        {/* Dark mode toggle */}
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200 transition-all"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-gray-400" />}
          {isDark ? 'Light mode' : 'Dark mode'}
        </button>

        {/* Agent indicator */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shrink-0">
            <Bot size={14} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">Agent</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">Online</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-100 dark:ring-emerald-900 shrink-0" />
        </div>
      </div>
    </aside>
  )
}
