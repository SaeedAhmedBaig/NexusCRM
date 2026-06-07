'use client';

import { useState } from 'react';
import {
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Eye,
  Pencil,
  Trash2,
  MoreHorizontal,
  X,
} from 'lucide-react';
import { ConfirmModal } from './confirm-modal';
import { StatusBadge } from '../ui/badge';
import { EmptyState } from '../ui/empty-state';
import { SkeletonTable } from '../ui/skeleton';
import { SearchInput } from '../ui/search-input';
import { PhoneDisplay } from '../ui/phone-display';
import { Inbox } from 'lucide-react';

const PAGE_SIZES = [10, 25, 50, 100];

export function DataTable({
  title,
  columns,
  data = [],
  total = 0,
  page = 1,
  limit = 25,
  totalPages = 1,
  sort,
  params,
  onParamsChange,
  loading,
  filters,
  filterOptions = {},
  onBulkAction,
  onRowClick,
  onRowView,
  onRowEdit,
  onRowDelete,
  detailPath,
  subdomain,
}) {
  const [selected, setSelected] = useState(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const allSelected = data.length > 0 && selected.size === data.length;

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(data.map((row) => row.id)));
  }

  function toggleRow(id) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function handleSort(field) {
    const desc = sort === `-${field}`;
    const next = desc ? field : `-${field}`;
    onParamsChange({ sort: next, page: '1' });
  }

  function SortIcon({ field }) {
    if (sort === field) return <ChevronUp className="h-3.5 w-3.5" />;
    if (sort === `-${field}`) return <ChevronDown className="h-3.5 w-3.5" />;
    return <ChevronDown className="h-3.5 w-3.5 opacity-30" />;
  }

  function renderCell(col, row) {
    if (col.render) return col.render(row[col.key], row);
    if (col.key === 'phone' && row[col.key]) {
      return <PhoneDisplay value={row[col.key]} contactId={row.id} companyId={row.company?.id} />;
    }
    const value = col.accessor ? col.accessor(row) : row[col.key];
    if (col.key === 'status') return <StatusBadge status={value} />;
    if (col.key === 'stage') return <StatusBadge status={value} />;
    if (col.type === 'currency') return value != null ? `$${Number(value).toLocaleString()}` : '—';
    if (col.type === 'date') return value ? new Date(value).toLocaleDateString() : '—';
    return value ?? '—';
  }

  async function runBulk(action, extra = {}, overrideIds) {
    const ids = overrideIds || [...selected];
    setConfirm(null);
    setBulkLoading(true);
    try {
      await onBulkAction?.(action, ids, extra);
      setSelected(new Set());
      setBulkMenuOpen(false);
    } finally {
      setBulkLoading(false);
    }
  }

  function askBulk(action, title, message, danger) {
    setConfirm({ action, title, message, danger });
    setBulkMenuOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {title ? <h1 className="text-h1 text-foreground">{title}</h1> : null}
          <p className="text-[13px] text-muted-foreground-foreground">{total.toLocaleString()} records</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selected.size > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setBulkMenuOpen(!bulkMenuOpen)}
                className="focus-ring flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-[13px] font-medium hover:bg-muted"
              >
                <MoreHorizontal className="h-4 w-4" />
                Bulk ({selected.size})
              </button>
              {bulkMenuOpen && (
                <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-border bg-card py-1 shadow-lg">
                  {filterOptions.statuses?.length > 0 && (
                    <button
                      type="button"
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-surface"
                      onClick={() => askBulk('change_status', 'Change status', `Update status for ${selected.size} record(s)?`)}
                    >
                      Change status
                    </button>
                  )}
                  <button
                    type="button"
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-surface"
                    onClick={() => askBulk('assign_owner', 'Assign owner', `Assign owner to ${selected.size} record(s)?`)}
                  >
                    Assign owner
                  </button>
                  <button
                    type="button"
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-surface"
                    onClick={() => askBulk('mass_mail', 'Create mass mail', `Queue mass mail for ${selected.size} record(s)?`)}
                  >
                    Create mass mail
                  </button>
                  <button
                    type="button"
                    className="block w-full px-4 py-2 text-left text-sm text-danger hover:bg-danger-light"
                    onClick={() => askBulk('delete', 'Delete records', `Permanently delete ${selected.size} record(s)?`, true)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="focus-ring flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-[13px] font-medium hover:bg-muted"
          >
            <Filter className="h-4 w-4" strokeWidth={2} />
            Filters
          </button>
        </div>
      </div>

      <SearchInput
        className="max-w-md"
        placeholder="Search…"
        defaultValue={params.q || ''}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onParamsChange({ q: e.target.value, page: '1' });
        }}
      />

      {loading ? (
        <SkeletonTable rows={8} />
      ) : (
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead className="sticky top-0 z-10 border-b border-border bg-muted/50">
              <tr>
                <th className="w-10 px-3 py-2.5">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded border-border" />
                </th>
                {columns.map((col) => (
                  <th key={col.key} className="px-3 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground-foreground">
                    {col.sortable !== false ? (
                      <button
                        type="button"
                        onClick={() => handleSort(col.sortKey || col.key)}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        {col.label}
                        <SortIcon field={col.sortKey || col.key} />
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                ))}
                <th className="w-24 px-3 py-2.5 text-right text-[11px] font-medium uppercase tracking-wide text-muted-foreground-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 2} className="p-0">
                    <EmptyState icon={Inbox} title="No records found" description="Try adjusting your search or filters." />
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr
                    key={row.id}
                    className={`border-b border-border/60 last:border-0 transition-colors hover:bg-muted/40 ${
                      selected.has(row.id) ? 'bg-muted/60' : ''
                    } ${onRowClick ? 'cursor-pointer' : ''}`}
                    onClick={() => onRowClick?.(row)}
                  >
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(row.id)}
                        onChange={() => toggleRow(row.id)}
                        className="rounded"
                      />
                    </td>
                    {columns.map((col) => (
                      <td key={col.key} className="px-3 py-2.5 text-foreground">
                        {renderCell(col, row)}
                      </td>
                    ))}
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-0.5">
                        <button
                          type="button"
                          title="View"
                          onClick={() => onRowView?.(row) || onRowClick?.(row)}
                          className="focus-ring rounded-md p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Edit"
                          onClick={() => onRowEdit?.(row)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          onClick={() =>
                            setConfirm({
                              action: 'delete_single',
                              rowId: row.id,
                              title: 'Delete record',
                              message: 'Permanently delete this record?',
                              danger: true,
                            })
                          }
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-danger-light hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Rows per page</span>
            <select
              value={limit}
              onChange={(e) => onParamsChange({ limit: e.target.value, page: '1' })}
              className="rounded-lg border border-border bg-card px-2 py-1 text-sm"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onParamsChange({ page: String(page - 1) })}
              className="rounded-lg border border-border p-1.5 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onParamsChange({ page: String(page + 1) })}
              className="rounded-lg border border-border p-1.5 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      )}

      {filterOpen && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <button type="button" className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setFilterOpen(false)} />
          <aside className="animate-slide-in-right relative flex h-full w-full max-w-sm flex-col border-l border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <h2 className="font-semibold">Filters</h2>
              <button type="button" onClick={() => setFilterOpen(false)} className="rounded-lg p-1 hover:bg-surface">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {filters?.map((f) => (
                <label key={f.key} className="block">
                  <span className="text-sm font-medium text-muted-foreground">{f.label}</span>
                  {f.type === 'select' ? (
                    <select
                      value={params[f.key] || ''}
                      onChange={(e) => onParamsChange({ [f.key]: e.target.value, page: '1' })}
                      className="input-base mt-1.5"
                    >
                      <option value="">All</option>
                      {(f.options || filterOptions[f.key] || []).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={f.type || 'text'}
                      value={params[f.key] || ''}
                      onChange={(e) => onParamsChange({ [f.key]: e.target.value, page: '1' })}
                      className="input-base mt-1.5"
                    />
                  )}
                </label>
              ))}
            </div>
            <div className="border-t border-border p-4">
              <button
                type="button"
                onClick={() => {
                  onParamsChange({ status: '', stage: '', department: '', owner: '', dateFrom: '', dateTo: '', page: '1' });
                  setFilterOpen(false);
                }}
                className="w-full rounded-xl border border-border py-2 text-sm font-medium hover:bg-surface"
              >
                Clear filters
              </button>
            </div>
          </aside>
        </div>
      )}

      <ConfirmModal
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        danger={confirm?.danger}
        loading={bulkLoading}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm?.action === 'delete_single') {
            runBulk('delete', {}, [confirm.rowId]);
          } else if (confirm?.action === 'change_status') {
            const status = filterOptions.status?.[0]?.value || filterOptions.statuses?.[0]?.value || 'open';
            runBulk('change_status', { status });
          } else if (confirm?.action === 'assign_owner') {
            runBulk('assign_owner', { assignedTo: params.owner || '' });
          } else {
            runBulk(confirm?.action);
          }
        }}
      />
    </div>
  );
}
