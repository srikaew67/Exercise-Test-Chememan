import { Menu, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TopBarProps {
  title: string;
  user: { email: string } | undefined;
  onMenuClick: () => void;
  onLogout: () => void;
}

export function TopBar({ title, user, onMenuClick, onLogout }: TopBarProps) {
  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open sidebar navigation"
          className="lg:hidden text-slate-500 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded p-1"
        >
          <Menu size={20} aria-hidden="true" />
        </button>
        <h1 className="text-base font-semibold text-slate-900">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-500 hidden sm:block">{user?.email}</span>
        <Button variant="ghost" size="icon" onClick={onLogout} aria-label="Log out">
          <LogOut size={16} aria-hidden="true" />
        </Button>
      </div>
    </header>
  );
}
