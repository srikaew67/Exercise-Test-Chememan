import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Department {
  id: string;
  name: string;
  code: string | null;
}

export function useDepartments() {
  const { data: departments = [], isLoading } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const r = await api.get('/departments');
      return r.data;
    },
  });
  return { departments, isLoading };
}
