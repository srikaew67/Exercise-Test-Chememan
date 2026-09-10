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
      <div
        className="rounded-xl border border-slate-200 overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
        tabIndex={0}
        role="region"
        aria-label="Employees table"
      >
        <table className="w-full text-sm table-fixed min-w-[65rem]">
          {/* Fixed column widths in rem — scales gracefully with user font size settings */}
          <colgroup>
            <col className="w-24" />  {/* ID: 6rem (~96px) */}
            <col className="w-52" />  {/* Name: 13rem (~208px) */}
            <col className="w-44" />  {/* Department: 11rem (~176px) */}
            <col className="w-32" />  {/* Salary: 8rem (~128px) */}
            <col className="w-32" />  {/* Join Date: 8rem (~128px) */}
            <col className="w-32" />  {/* Status: 8rem (~128px) */}
            <col className="w-40" />  {/* Last Updated Date: 10rem (~160px) */}
            {columns.length > 7 && <col className="w-28" />}  {/* Actions (admin only): 7rem (~112px) */}
          </colgroup>
          <thead className="bg-slate-50 border-b border-slate-200">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} scope="col" className="text-left px-4 py-3 first:pl-5 last:pr-5 truncate">
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
                    <td colSpan={columns.length} role="status" className="text-center py-16 text-slate-400 text-sm">
                      No employees found
                    </td>
                  </tr>
                )
              : table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 first:pl-5 last:pr-5 truncate max-w-0">
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
        <span aria-live="polite" aria-atomic="true">{total} total employees</span>
        <nav aria-label="Pagination Navigation" className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
            className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span aria-current="page" className="px-3">Page {page} of {totalPages}</span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next page"
            className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
          >
            Next
          </button>
        </nav>
      </div>
    </div>
  );
}
