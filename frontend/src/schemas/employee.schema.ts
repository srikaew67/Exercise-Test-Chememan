import { z } from 'zod';

export const employeeSchema = z.object({
  empCode: z.string().min(1, 'Employee code is required'),
  name: z.string().min(1, 'Name is required'),
  departmentId: z.string().min(1, 'Department is required'),
  salary: z.coerce.number().positive('Salary must be positive'),
  joinDate: z.string().min(1, 'Join date is required'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'RESIGNED', 'ON_LEAVE']),
  lastUpdatedDate: z.string().min(1, 'Last updated date is required'),
});

export type EmployeeFormData = z.infer<typeof employeeSchema>;
