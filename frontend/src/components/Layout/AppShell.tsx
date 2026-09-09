import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAuth } from '@/hooks/useAuth';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/employees': 'Employees',
  '/departments': 'Departments',
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAdmin, logout } = useAuth();
  const { pathname } = useLocation();
  const title = pageTitles[pathname] ?? 'Employee Portal';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar isAdmin={isAdmin} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar title={title} user={user} onMenuClick={() => setSidebarOpen(true)} onLogout={logout} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
