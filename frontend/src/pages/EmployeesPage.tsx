import { useState, useCallback } from 'react';
import { useDebounce } from '@uidotdev/usehooks';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { EmployeeTable } from '@/components/EmployeeTable/EmployeeTable';
import { EmployeeModal } from '@/components/EmployeeModal/EmployeeModal';
import { ImportModal } from '@/components/ImportModal/ImportModal';
import { buildColumns } from '@/components/EmployeeTable/columns';
import { useAuth } from '@/hooks/useAuth';
import { useEmployees, useDeleteEmployee, useCreateEmployee, useUpdateEmployee, type Employee } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useDepartments';
import type { EmployeeFormData } from '@/schemas/employee.schema';
import { Plus, Upload, Download, Search } from 'lucide-react';
import { api } from '@/lib/api';

export function EmployeesPage() {
  const { isAdmin } = useAuth();
  const { departments } = useDepartments();

  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('name');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const debouncedSearch = useDebounce(search, 300);

  const { employees, total, isLoading } = useEmployees({
    search: debouncedSearch || undefined,
    departmentId: departmentId || undefined,
    status: status || undefined,
    page,
    limit: 20,
    sortBy,
    order,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

  const deleteEmp = useDeleteEmployee();
  const createEmp = useCreateEmployee();
  const updateEmp = useUpdateEmployee();

  const handleSort = useCallback((col: string) => {
    setSortBy(prevCol => {
      if (prevCol === col) {
        setOrder(prevOrder => (prevOrder === 'asc' ? 'desc' : 'asc'));
      } else {
        setOrder('asc');
      }
      return col;
    });
    setPage(1);
  }, []);

  const handleEdit = useCallback((emp: Employee) => {
    setEditEmployee(emp);
    setModalOpen(true);
  }, []);

  const handleDelete = useCallback((emp: Employee) => {
    setDeleteTarget(emp);
  }, []);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEmp.mutateAsync(deleteTarget.id);
      toast.success(`${deleteTarget.name} deleted`);
    } catch {
      toast.error('Failed to delete employee');
    }
    setDeleteTarget(null);
  };

  const handleSubmit = async (data: EmployeeFormData) => {
    try {
      if (editEmployee) {
        await updateEmp.mutateAsync({ id: editEmployee.id, data });
        toast.success('Employee updated');
      } else {
        await createEmp.mutateAsync(data);
        toast.success('Employee created');
      }
      setModalOpen(false);
      setEditEmployee(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || 'Failed to save employee');
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (departmentId) params.set('departmentId', departmentId);
      if (status) params.set('status', status);
      const res = await api.get(`/employees/export?${params.toString()}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'employees.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Export failed');
    }
  };

  const columns = buildColumns({
    isAdmin,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onSort: handleSort,
    sortBy,
    order,
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-1 max-w-2xl flex-wrap">
          <div className="relative flex-1 min-w-40">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-8"
              placeholder="Search by name…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Select
            value={departmentId || 'all'}
            onValueChange={(v) => {
              setDepartmentId(v === 'all' ? '' : v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status || 'all'}
            onValueChange={(v) => {
              setStatus(v === 'all' ? '' : v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="RESIGNED">Resigned</SelectItem>
              <SelectItem value="ON_LEAVE">On Leave</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download size={14} className="mr-1" />
            Export
          </Button>
          {isAdmin && (
            <>
              <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                <Upload size={14} className="mr-1" />
                Import
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setEditEmployee(null);
                  setModalOpen(true);
                }}
              >
                <Plus size={14} className="mr-1" />
                Add Employee
              </Button>
            </>
          )}
        </div>
      </div>

      <EmployeeTable
        data={employees}
        columns={columns}
        isLoading={isLoading}
        total={total}
        page={page}
        limit={20}
        onPageChange={setPage}
      />

      <EmployeeModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditEmployee(null);
        }}
        onSubmit={handleSubmit}
        employee={editEmployee}
        isLoading={createEmp.isPending || updateEmp.isPending}
      />

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />

      {deleteTarget && (
        <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete Employee</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-slate-600 py-2">
              Delete <strong>{deleteTarget.name}</strong>? This cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={deleteEmp.isPending}>
                {deleteEmp.isPending ? 'Deleting…' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
