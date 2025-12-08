import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import type {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  OnChangeFn,
  FilterFn,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Contract } from '../types';

// Custom filter function to handle operator-based filtering
const operatorFilter: FilterFn<Contract> = (row, columnId, filterValue) => {
  // Handle simple string filter (for global filter or manual typing)
  if (typeof filterValue === 'string') {
    const cellValue = String(row.getValue(columnId) ?? '').toLowerCase();
    return cellValue.includes(filterValue.toLowerCase());
  }

  // Handle operator-based filter from AI
  if (typeof filterValue === 'object' && filterValue.operator) {
    const { operator, value, value2 } = filterValue;
    const cellValue = row.getValue(columnId);

    switch (operator) {
      case 'equals':
        return String(cellValue).toLowerCase() === String(value).toLowerCase();
      case 'notEquals':
        return String(cellValue).toLowerCase() !== String(value).toLowerCase();
      case 'contains':
        return String(cellValue).toLowerCase().includes(String(value).toLowerCase());
      case 'startsWith':
        return String(cellValue).toLowerCase().startsWith(String(value).toLowerCase());
      case 'endsWith':
        return String(cellValue).toLowerCase().endsWith(String(value).toLowerCase());
      case 'greaterThan':
        return Number(cellValue) > Number(value);
      case 'lessThan':
        return Number(cellValue) < Number(value);
      case 'greaterThanOrEqual':
        return Number(cellValue) >= Number(value);
      case 'lessThanOrEqual':
        return Number(cellValue) <= Number(value);
      case 'between':
        return Number(cellValue) >= Number(value) && Number(cellValue) <= Number(value2);
      default:
        return true;
    }
  }

  return true;
};

interface DataTableProps {
  data: Contract[];
  sorting: SortingState;
  setSorting: OnChangeFn<SortingState>;
  columnFilters: ColumnFiltersState;
  setColumnFilters: OnChangeFn<ColumnFiltersState>;
  globalFilter: string;
  setGlobalFilter: (filter: string) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  pageIndex: number;
  setPageIndex: (index: number) => void;
}

// Neumorphism styles
const neumorph = {
  inset: {
    boxShadow: 'inset 4px 4px 8px #d4cfc6, inset -4px -4px 8px #ffffff',
    borderRadius: '16px',
    backgroundColor: '#e8e0d5',
  },
  button: {
    boxShadow: '4px 4px 8px #d4cfc6, -4px -4px 8px #ffffff',
    borderRadius: '12px',
    backgroundColor: '#e8e0d5',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  buttonPressed: {
    boxShadow: 'inset 2px 2px 4px #d4cfc6, inset -2px -2px 4px #ffffff',
  }
};

const columns: ColumnDef<Contract>[] = [
  {
    accessorKey: 'contractName',
    header: 'Contract Name',
    filterFn: operatorFilter,
    cell: info => (
      <span style={{ fontWeight: 500, color: '#1f2937', fontSize: '0.9375rem' }}>{info.getValue() as string}</span>
    )
  },
  {
    accessorKey: 'clientName',
    header: 'Client',
    filterFn: operatorFilter,
    cell: info => (
      <span style={{ color: '#4b5563', fontSize: '0.9375rem' }}>{info.getValue() as string}</span>
    )
  },
  {
    accessorKey: 'value',
    header: 'Value',
    filterFn: operatorFilter,
    cell: info => {
      const value = info.getValue() as number;
      return (
        <span style={{ fontWeight: 600, color: '#7c3aed', fontSize: '0.9375rem' }}>
          ${value.toLocaleString()}
        </span>
      );
    }
  },
  {
    accessorKey: 'startDate',
    header: 'Start',
    filterFn: operatorFilter,
    cell: info => (
      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{info.getValue() as string}</span>
    )
  },
  {
    accessorKey: 'endDate',
    header: 'End',
    filterFn: operatorFilter,
    cell: info => (
      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{info.getValue() as string}</span>
    )
  },
  {
    accessorKey: 'status',
    header: 'Status',
    filterFn: operatorFilter,
    cell: info => {
      const status = info.getValue() as string;
      const colors: Record<string, { bg: string; text: string }> = {
        active: { bg: '#d1fae5', text: '#065f46' },
        pending: { bg: '#fef3c7', text: '#92400e' },
        expired: { bg: '#e5e7eb', text: '#4b5563' },
        cancelled: { bg: '#fee2e2', text: '#991b1b' }
      };
      const color = colors[status] || colors.expired;
      return (
        <span style={{
          display: 'inline-flex',
          padding: '5px 14px',
          borderRadius: '20px',
          fontSize: '0.8125rem',
          fontWeight: 500,
          backgroundColor: color.bg,
          color: color.text,
          boxShadow: '2px 2px 4px #d4cfc6, -2px -2px 4px #ffffff',
          textTransform: 'capitalize'
        }}>
          {status}
        </span>
      );
    }
  }
];

export default function DataTable({
  data,
  sorting,
  setSorting,
  columnFilters,
  setColumnFilters,
  globalFilter,
  setGlobalFilter,
  pageSize,
  setPageSize,
  pageIndex,
  setPageIndex
}: DataTableProps) {
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination: { pageIndex, pageSize }
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newState = updater({ pageIndex, pageSize });
        setPageIndex(newState.pageIndex);
        setPageSize(newState.pageSize);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Table */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto', 
        ...neumorph.inset,
        padding: '4px'
      }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    style={{
                      padding: '14px 16px',
                      textAlign: 'left',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: '#4b5563',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                      cursor: 'pointer',
                      backgroundColor: '#e8e0d5',
                      position: 'sticky',
                      top: 0,
                      zIndex: 1
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <span style={{ color: '#a855f7' }}>
                        {header.column.getIsSorted() === 'asc' && <ChevronUp size={14} />}
                        {header.column.getIsSorted() === 'desc' && <ChevronDown size={14} />}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
                  No contracts found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, idx) => (
                <tr 
                  key={row.id}
                  style={{
                    backgroundColor: idx % 2 === 0 ? '#ebe4d9' : '#e8e0d5',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3ece0'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ebe4d9' : '#e8e0d5'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} style={{ padding: '12px 16px' }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginTop: '16px',
        padding: '12px 0'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            style={{
              ...neumorph.button,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '10px 16px',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              opacity: !table.getCanPreviousPage() ? 0.5 : 1,
            }}
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            style={{
              ...neumorph.button,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '10px 16px',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              opacity: !table.getCanNextPage() ? 0.5 : 1,
            }}
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Page <span style={{ fontWeight: 600, color: '#7c3aed' }}>{table.getState().pagination.pageIndex + 1}</span> of{' '}
            <span style={{ fontWeight: 600 }}>{table.getPageCount() || 1}</span>
          </span>
          
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            style={{
              ...neumorph.button,
              padding: '10px 16px',
              fontSize: '0.875rem',
              color: '#374151',
              appearance: 'none',
              paddingRight: '32px',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
            }}
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                Show {size}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
