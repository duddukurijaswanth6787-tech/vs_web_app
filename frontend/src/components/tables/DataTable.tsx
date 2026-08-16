'use client';

import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, CheckSquare, Square, AlertCircle } from 'lucide-react';
import { SectionLoader } from '@/components/feedback/FeedbackStates';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  onPageChange: (page: number) => void;
  onSort?: (key: string) => void;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  rowKey: (item: T) => string;
  bulkActions?: React.ReactNode;
}

export default function DataTable<T>({
  columns, data, total, page, pageSize, sortBy, sortOrder,
  loading, error, onRetry, onPageChange, onSort,
  selectedIds, onSelectionChange, onRowClick,
  emptyMessage = 'No records found', rowKey, bulkActions,
}: DataTableProps<T>) {
  const totalPages = Math.ceil(total / pageSize) || 1;
  const allSelected = data.length > 0 && selectedIds?.size === data.length;

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) onSelectionChange(new Set());
    else onSelectionChange(new Set(data.map(rowKey)));
  };

  const toggleOne = (id: string) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  };

  if (loading) return <SectionLoader message="Loading..." />;

  if (error) return (
    <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center shadow-sm">
      <AlertCircle className="w-10 h-10 text-red-300 mx-auto mb-3" />
      <p className="text-sm text-neutral-500 mb-3">Failed to load data</p>
      {onRetry && <button onClick={onRetry} className="bg-neutral-900 text-white rounded-lg px-4 py-2 text-xs font-bold">Retry</button>}
    </div>
  );

  if (!data.length) return (
    <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center shadow-sm">
      <p className="text-sm text-neutral-500">{emptyMessage}</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {selectedIds && selectedIds.size > 0 && bulkActions && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-neutral-50 rounded-xl px-3 sm:px-4 py-2.5 border border-neutral-200">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="text-xs font-semibold text-neutral-700">{selectedIds.size} selected</span>
            <div className="flex items-center gap-1.5 flex-wrap">{bulkActions}</div>
          </div>
          <button onClick={() => onSelectionChange?.(new Set())} className="text-xs text-neutral-500 hover:text-neutral-700 font-medium">Clear</button>
        </div>
      )}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[640px] text-xs" role="grid" aria-label="Data table">
          <thead className="bg-neutral-50 border-b border-neutral-200 sticky top-0 z-10">
            <tr>
              {onSelectionChange && (
                <th className="px-3 py-3 w-8" scope="col">
                  <button onClick={toggleAll} className="text-neutral-400 hover:text-neutral-600" aria-label={allSelected ? 'Deselect all' : 'Select all'}>
                    {allSelected ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
              )}
              {columns.map((col) => (
                <th key={col.key} scope="col" className={`text-left px-4 py-3 font-bold text-neutral-500 ${col.sortable ? 'cursor-pointer hover:text-neutral-700 select-none' : ''}`}
                  onClick={() => col.sortable && onSort?.(col.key)}
                  aria-sort={col.sortable && sortBy === col.key ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}>
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      sortBy === col.key ? (
                        sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      ) : <ChevronsUpDown className="w-3 h-3 text-neutral-300" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100" role="rowgroup">
            {data.map((item, index) => {
              const id = rowKey(item);
              const checked = selectedIds?.has(id);
              return (
                <tr key={id} onClick={() => onRowClick?.(item)}
                  onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onRowClick) { e.preventDefault(); onRowClick(item); } }}
                  tabIndex={onRowClick ? 0 : undefined}
                  role={onRowClick ? 'button' : undefined}
                  aria-label={onRowClick ? `View details for row ${index + 1}` : undefined}
                  className={`${onRowClick ? 'cursor-pointer' : ''} hover:bg-neutral-50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-neutral-400`}>
                  {onSelectionChange && (
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => toggleOne(id)} className="text-neutral-400 hover:text-neutral-600" aria-label={checked ? 'Deselect' : 'Select'}>
                        {checked ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                  )}
                  {columns.map((col) => <td key={col.key} className="px-4 py-3 text-neutral-700">{col.render(item)}</td>)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white rounded-xl border border-neutral-200 px-4 py-3 shadow-sm">
          <p className="text-xs text-neutral-500 text-center sm:text-left">{total} items · Page {page} of {totalPages}</p>
          <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-end">
            <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}
              className="flex-1 sm:flex-none px-4 py-2 border border-neutral-200 rounded-lg text-xs font-medium disabled:opacity-30 hover:bg-neutral-50 active:bg-neutral-100 min-h-[38px] flex items-center justify-center">Prev</button>
            <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}
              className="flex-1 sm:flex-none px-4 py-2 border border-neutral-200 rounded-lg text-xs font-medium disabled:opacity-30 hover:bg-neutral-50 active:bg-neutral-100 min-h-[38px] flex items-center justify-center">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
