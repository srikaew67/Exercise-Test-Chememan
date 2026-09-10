import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isAdmin: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isAdmin, isOpen, onClose }: SidebarProps) {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/employees', label: 'Employees', icon: Users },
  ];
  const adminItems = [
    { to: '/departments', label: 'Departments', icon: Building2 },
  ];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-20 bg-black/30 lg:hidden" onClick={onClose} />
      )}
      <aside className={cn(
        'fixed top-0 left-0 z-30 h-full w-60 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200',
        'lg:translate-x-0 lg:static lg:z-auto',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-200">
          <span className="text-base font-semibold text-slate-900">EMP Portal</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar navigation"
            className="lg:hidden text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded p-1"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Main navigation">
          {navItems.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to} to={to} end={exact} onClick={onClose}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon size={16} />{label}
            </NavLink>
          ))}
          {isAdmin && adminItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to} to={to} onClick={onClose}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon size={16} />{label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
