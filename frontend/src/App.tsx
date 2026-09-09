import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { queryClient } from './lib/queryClient';
import { LoginPage } from './pages/LoginPage';
import { AppShell } from './components/Layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('access_token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <AppShell>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/employees" element={<div className="text-slate-500 text-sm">Employees — coming in Task 9</div>} />
                  <Route path="/departments" element={<div className="text-slate-500 text-sm">Departments — coming in Task 10</div>} />
                </Routes>
              </AppShell>
            </ProtectedRoute>
          } />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
