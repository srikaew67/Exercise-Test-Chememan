import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

interface Department {
  id: string;
  name: string;
  code: string | null;
}

const deptSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().optional(),
});
type DeptForm = z.infer<typeof deptSchema>;

export function DepartmentsPage() {
  const { isAdmin, isLoading: authLoading } = useAuth();

  const qc = useQueryClient();
  const { data: departments = [], isLoading } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const r = await api.get('/departments');
      return r.data;
    },
    enabled: isAdmin,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DeptForm>({
    resolver: zodResolver(deptSchema),
  });

  const openCreate = () => {
    setEditDept(null);
    reset({ name: '', code: '' });
    setModalOpen(true);
  };

  const openEdit = (d: Department) => {
    setEditDept(d);
    reset({ name: d.name, code: d.code ?? '' });
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (data: DeptForm) => {
      const payload = {
        name: data.name.trim(),
        code: data.code?.trim() || undefined,
      };
      return editDept
        ? api.patch(`/departments/${editDept.id}`, payload)
        : api.post('/departments', payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      toast.success(editDept ? 'Department updated' : 'Department created');
      setModalOpen(false);
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || 'Failed to save department');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/departments/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department deleted');
      setDeleteTarget(null);
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Cannot delete department');
      setDeleteTarget(null);
    },
  });

  if (authLoading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{departments.length} departments</p>
        <Button size="sm" onClick={openCreate}>
          <Plus size={14} className="mr-1" />
          Add Department
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th scope="col" className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
              <th scope="col" className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Code</th>
              <th scope="col" className="px-5 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} role="status" className="text-center py-10 text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : departments.length === 0 ? (
              <tr>
                <td colSpan={3} role="status" className="text-center py-10 text-slate-400">
                  No departments yet
                </td>
              </tr>
            ) : (
              departments.map((d) => (
                <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-900">{d.name}</td>
                  <td className="px-5 py-3">
                    {d.code ? <Badge variant="outline">{d.code}</Badge> : <span className="text-slate-400 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(d)}
                        aria-label={`Edit ${d.name} department`}
                      >
                        <Pencil size={14} aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:text-red-600"
                        onClick={() => setDeleteTarget(d)}
                        aria-label={`Delete ${d.name} department`}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editDept ? 'Edit Department' : 'New Department'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="dept-name">Name</Label>
              <Input id="dept-name" {...register('name')} placeholder="Engineering" />
              {errors.name && <p role="alert" className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="dept-code">
                Code <span className="text-slate-400 text-xs">(optional)</span>
              </Label>
              <Input id="dept-code" {...register('code')} placeholder="ENG" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving…' : editDept ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {deleteTarget && (
        <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete Department</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-slate-600 py-2">
              Delete <strong>{deleteTarget.name}</strong>? This will fail if employees are assigned to it.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
