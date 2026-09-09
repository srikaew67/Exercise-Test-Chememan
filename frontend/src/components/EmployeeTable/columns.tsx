import type { LegacyColumnDef as ColumnDef } from '@tanstack/react-table/legacy';
import { ArrowUpDown, ArrowUp, ArrowDown, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Employee } from '@/hooks/useEmployees';

interface ColOptions {
  isAdmin: boolean;
  onEdit: (emp: Employee) => void;
  onDelete: (emp: Employee) => void;
  onSort: (col: string) => void;
  sortBy: string;
  order?: 'asc' | 'desc';
}

function SortButton({
  col,
  label,
  onSort,
  active,
  order,
}: {
  col: string;
  label: string;
  onSort: (c: string) => void;
  active: boolean;
  order?: 'asc' | 'desc';
}) {
  return (
    <button
      type="button"
      className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-800"
      onClick={() => onSort(col)}
    >
      {label}
      {active ? (
        order === 'desc' ? (
          <ArrowDown size={12} className="text-slate-800" />
        ) : (
          <ArrowUp size={12} className="text-slate-800" />
        )
      ) : (
        <ArrowUpDown size={12} className="text-slate-400" />
      )}
    </button>
  );
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ACTIVE: 'default',
  INACTIVE: 'secondary',
  RESIGNED: 'destructive',
  ON_LEAVE: 'outline',
};

export function formatSalary(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return '0.00';
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, ''));
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatExcelDate(dateVal: string | Date | null | undefined): string {
  if (!dateVal) return '-';
  const str = String(dateVal).trim();
  if (/^\d{1,2}-[A-Za-z]{3}-\d{2}$/.test(str)) return str;

  const d = dateVal instanceof Date ? dateVal : new Date(str);
  if (isNaN(d.getTime())) return str;

  const isUtc = typeof dateVal === 'string' && (dateVal.includes('Z') || dateVal.includes('T') || /^\d{4}-\d{2}-\d{2}$/.test(dateVal));
  const day = String(isUtc ? d.getUTCDate() : d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[isUtc ? d.getUTCMonth() : d.getMonth()];
  const year = String(isUtc ? d.getUTCFullYear() : d.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

export function formatStatus(val: string | null | undefined): string {
  if (!val) return '';
  const upper = val.toUpperCase().replace(/\s+/g, '');
  if (upper === 'INACTIVE') return 'In Active';
  if (upper === 'ACTIVE') return 'Active';
  return val
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function buildColumns({ isAdmin, onEdit, onDelete, onSort, sortBy, order }: ColOptions): ColumnDef<Employee>[] {
  const cols: ColumnDef<Employee>[] = [
    {
      accessorKey: 'empCode',
      header: () => (
        <SortButton col="empCode" label="ID" onSort={onSort} active={sortBy === 'empCode'} order={order} />
      ),
      cell: ({ row }) => <span className="font-mono text-xs text-slate-600">{row.original.empCode}</span>,
    },
    {
      accessorKey: 'name',
      header: () => (
        <SortButton col="name" label="Name" onSort={onSort} active={sortBy === 'name'} order={order} />
      ),
      cell: ({ row }) => <span className="font-medium text-slate-900">{row.original.name}</span>,
    },
    {
      id: 'department',
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Department</span>,
      cell: ({ row }) => <span className="text-sm text-slate-700">{row.original.department?.name}</span>,
    },
    {
      accessorKey: 'salary',
      header: () => (
        <SortButton col="salary" label="Salary" onSort={onSort} active={sortBy === 'salary'} order={order} />
      ),
      cell: ({ row }) => <span className="text-sm font-medium text-slate-700">{formatSalary(row.original.salary)}</span>,
    },
    {
      accessorKey: 'joinDate',
      header: () => (
        <SortButton col="joinDate" label="Join Date" onSort={onSort} active={sortBy === 'joinDate'} order={order} />
      ),
      cell: ({ row }) => <span className="text-sm text-slate-600">{formatExcelDate(row.original.joinDate)}</span>,
    },
    {
      accessorKey: 'status',
      header: () => (
        <SortButton col="status" label="Status" onSort={onSort} active={sortBy === 'status'} order={order} />
      ),
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANTS[row.original.status] ?? 'secondary'}>
          {formatStatus(row.original.status)}
        </Badge>
      ),
    },
    {
      accessorKey: 'lastUpdatedDate',
      header: () => (
        <SortButton
          col="lastUpdatedDate"
          label="Last Updated Date"
          onSort={onSort}
          active={sortBy === 'lastUpdatedDate'}
          order={order}
        />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-slate-600">
          {formatExcelDate(row.original.lastUpdatedDate)}
        </span>
      ),
    },
  ];

  if (isAdmin) {
    cols.push({
      id: 'actions',
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</span>,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(row.original)}>
            <Pencil size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-red-400 hover:text-red-600"
            onClick={() => onDelete(row.original)}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    });
  }
  return cols;
}
