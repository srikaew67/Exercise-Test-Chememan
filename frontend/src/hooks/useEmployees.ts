import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Employee {
  id: string;
  empCode: string;
  name: string;
  department: { id: string; name: string };
  salary: number;
  joinDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'RESIGNED' | 'ON_LEAVE';
  lastUpdatedDate: string;
}

export interface EmployeeQuery {
  search?: string;
  departmentId?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: string;
}

export function useEmployees(query: EmployeeQuery) {
  const { data, isLoading } = useQuery({
    queryKey: ['employees', query],
    queryFn: async () => {
      const params = Object.fromEntries(
        Object.entries(query).filter(([, v]) => v !== undefined && v !== '')
      );
      const r = await api.get('/employees', { params });
      return r.data as { data: Employee[]; total: number; page: number; limit: number };
    },
    placeholderData: (prev) => prev,
  });
  return { employees: data?.data ?? [], total: data?.total ?? 0, isLoading };
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/employees/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/employees', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.patch(`/employees/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}
