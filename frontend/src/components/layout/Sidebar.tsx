import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, CalendarDays, FlaskConical, TrendingUp } from 'lucide-react';

const NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Journal', icon: BookOpen, path: '/journal' },
  { label: 'Calendar', icon: CalendarDays, path: '/calendar' },
  { label: 'Backtest', icon: FlaskConical, path: '/backtest' },
];

export function Sidebar() {
  return (
    <aside className="w-[220px] min-h-screen bg-white border-r border-gray-100 flex flex-col py-4 fixed top-0 left-0 z-40">
      <div className="flex items-center gap-2.5 px-5 mb-8">
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
          <TrendingUp size={16} className="text-white" />
        </div>
        <span className="text-sm font-bold text-gray-900">BackTest Pro</span>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
               ${isActive
                 ? 'bg-blue-50 text-blue-700'
                 : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
               }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 mt-auto">
        <div className="text-xs text-gray-400">BackTest Pro v1.0</div>
      </div>
    </aside>
  );
}
