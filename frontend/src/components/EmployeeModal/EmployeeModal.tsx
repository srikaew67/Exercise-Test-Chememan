import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { employeeSchema, type EmployeeFormData } from '@/schemas/employee.schema';
import { useDepartments } from '@/hooks/useDepartments';
import type { Employee } from '@/hooks/useEmployees';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EmployeeFormData) => void;
  employee?: Employee | null;
  isLoading?: boolean;
}

export function EmployeeModal({ open, onClose, onSubmit, employee, isLoading }: Props) {
  const { departments } = useDepartments();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema) as any,
    defaultValues: {
      empCode: '',
      name: '',
      departmentId: '',
      salary: 0,
      joinDate: '',
      status: 'ACTIVE',
      lastUpdatedDate: '',
    },
  });

  const currentStatus = watch('status');
  const currentDepartmentId = watch('departmentId');

  useEffect(() => {
    if (open) {
      if (employee) {
        reset({
          empCode: employee.empCode,
          name: employee.name,
          departmentId: employee.department?.id || '',
          salary: Number(employee.salary),
          joinDate: employee.joinDate ? employee.joinDate.split('T')[0] : '',
          status: employee.status,
          lastUpdatedDate: employee.lastUpdatedDate ? employee.lastUpdatedDate.split('T')[0] : '',
        });
      } else {
        const today = new Date().toISOString().split('T')[0];
        reset({
          empCode: '',
          name: '',
          departmentId: '',
          salary: undefined as unknown as number,
          joinDate: today,
          status: 'ACTIVE',
          lastUpdatedDate: today,
        });
      }
    }
  }, [employee, open, reset]);

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{employee ? 'Edit Employee' : 'New Employee'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Employee Code</Label>
              <Input {...register('empCode')} placeholder="EMP001" />
              {errors.empCode && <p className="text-xs text-red-500">{errors.empCode.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select
                value={currentStatus || 'ACTIVE'}
                onValueChange={(v) => setValue('status', v as EmployeeFormData['status'], { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="RESIGNED">Resigned</SelectItem>
                  <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-xs text-red-500">{errors.status.message}</p>}
            </div>
          </div>
          <div className="space-y-1">
            <Label>Full Name</Label>
            <Input {...register('name')} placeholder="Jane Doe" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Department</Label>
            <Select
              value={currentDepartmentId || undefined}
              onValueChange={(v) => setValue('departmentId', v, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.departmentId && <p className="text-xs text-red-500">{errors.departmentId.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Salary</Label>
              <Input type="number" step="any" {...register('salary')} placeholder="50000" />
              {errors.salary && <p className="text-xs text-red-500">{errors.salary.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Join Date</Label>
              <Input type="date" {...register('joinDate')} />
              {errors.joinDate && <p className="text-xs text-red-500">{errors.joinDate.message}</p>}
            </div>
          </div>
          <div className="space-y-1">
            <Label>Last Updated Date</Label>
            <Input type="date" {...register('lastUpdatedDate')} />
            {errors.lastUpdatedDate && <p className="text-xs text-red-500">{errors.lastUpdatedDate.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving…' : employee ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
