import { useAuth } from '@/hooks/useAuth';

export function DashboardPage() {
  const { user, isAdmin } = useAuth();
  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-semibold text-slate-900 mb-1">Welcome back!</h2>
      <p className="text-sm text-slate-500">
        Signed in as <span className="font-medium text-slate-700">{user?.email}</span>
        {' '}·{' '}
        <span className="text-xs uppercase tracking-wide bg-slate-100 px-1.5 py-0.5 rounded">{user?.role}</span>
      </p>
      {isAdmin && (
        <p className="mt-4 text-sm text-slate-600">
          You have admin access. Navigate to Employees or Departments to manage records.
        </p>
      )}
    </div>
  );
}
