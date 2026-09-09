import { useLegacyTable as useReactTable, getCoreRowModel, type LegacyColumnDef as ColumnDef } from '@tanstack/react-table/legacy';
import { flexRender } from '@tanstack/react-table';
import { Skeleton } from '@/components/ui/skeleton';
import type { Employee } from '@/hooks/useEmployees';

interface Props {
  data: Employee[];
  columns: ColumnDef<Employee>[];
  isLoading: boolean;
  total: number;
  page: number;
  limit: number;
  onPageChange: (p: number) => void;
}

export function EmployeeTable({ data, columns, isLoading, total, page, limit, onPageChange }: Props) {
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div>
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} className="text-left px-4 py-3 first:pl-5 last:pr-5">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    {columns.map((_, j) => (
                      <td key={j} className="px-4 py-3 first:pl-5 last:pr-5">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              : table.getRowModel().rows.length === 0
              ? (
                  <tr>
                    <td colSpan={columns.length} className="text-center py-16 text-slate-400 text-sm">
                      No employees found
                    </td>
                  </tr>
                )
              : table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 first:pl-5 last:pr-5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
        <span>{total} total employees</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-3">Page {page} of {totalPages}</span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
