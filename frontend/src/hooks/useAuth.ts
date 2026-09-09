import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface AuthUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

export function useAuth() {
  const token = localStorage.getItem('access_token');
  const { data: user, isLoading } = useQuery<AuthUser>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await api.get<AuthUser>('/auth/me');
      return res.data;
    },
    enabled: !!token,
    retry: false,
  });

  const logout = () => {
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  };

  return { user, isAdmin: user?.role === 'ADMIN', isLoading, logout };
}
