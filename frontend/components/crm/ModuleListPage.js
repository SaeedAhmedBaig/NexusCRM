'use client';

import { useCallback, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { DataTable } from './DataTable';
import { useListParams } from './use-list-params';
import { listDepartments, listTenantUsers } from '../../lib/api';
import { PageHeader } from '../ui/page-header';
import { Button } from '../ui/button';
import { withMutationNotify } from '../../lib/mutation-options';

export function ModuleListPage({
  title,
  description,
  entity,
  columns,
  fetchList,
  createRecord,
  bulkAction,
  filters,
  filterOptions: staticFilterOptions = {},
  createFields = [],
  createDefaults = {},
}) {
  const { params, setParams } = useListParams();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(createDefaults);

  const { data, isLoading, error } = useQuery({
    queryKey: [entity, params],
    queryFn: () => fetchList(params),
    meta: { suppressErrorToast: true },
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: listDepartments,
    staleTime: 120_000,
  });

  const { data: users } = useQuery({
    queryKey: ['tenant-users'],
    queryFn: () => listTenantUsers(),
    staleTime: 120_000,
  });

  const createMutation = useMutation(
    withMutationNotify({
      mutationFn: createRecord,
      successMessage: 'Record created',
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [entity] });
        setShowCreate(false);
        setForm(createDefaults);
      },
    }),
  );

  const filterOptions = {
    ...staticFilterOptions,
    status: staticFilterOptions.statuses || [],
    department: (departments || []).map((d) => ({ value: d.id || String(d._id), label: d.name })),
    owner: (users || []).map((u) => ({ value: u.userId || u.id, label: u.name || u.email })),
  };

  const handleBulk = useCallback(
    async (action, ids, extra = {}) => {
      if (!bulkAction) return;
      const payload = { action, ids };
      if (action === 'change_status') {
        payload.payload = { status: extra.status };
      } else if (action === 'assign_owner') {
        payload.payload = { assignedTo: extra.assignedTo || params.owner };
      }
      await bulkAction(payload);
      queryClient.invalidateQueries({ queryKey: [entity] });
    },
    [bulkAction, entity, params.owner, queryClient],
  );

  if (error) {
    return (
      <div className="rounded-2xl border border-danger/20 bg-danger-light p-6 text-sm text-danger">
        {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          createRecord ? (
            <Button type="button" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              New
            </Button>
          ) : null
        }
      />

      {showCreate && createFields.length > 0 && (
        <form
          className="rounded-xl border border-border bg-card p-5"
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(form);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {createFields.map((field) => (
              <label key={field.key} className="block text-sm">
                <span className="mb-1 block font-medium text-foreground">{field.label}</span>
                {field.type === 'select' ? (
                  <select
                    className="input-base"
                    value={form[field.key] ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                  >
                    {(field.options || []).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    className="input-base min-h-[80px]"
                    value={form[field.key] ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                    required={field.required}
                  />
                ) : (
                  <input
                    className="input-base"
                    type={field.type || 'text'}
                    value={form[field.key] ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                    required={field.required}
                  />
                )}
              </label>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving…' : 'Create'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
          </div>
          {createMutation.error && (
            <p className="mt-2 text-sm text-danger">{createMutation.error.message}</p>
          )}
        </form>
      )}

      <DataTable
        title=""
        columns={columns}
        data={data?.data || []}
        total={data?.total || 0}
        page={data?.page || 1}
        limit={data?.limit || Number(params.limit) || 25}
        totalPages={data?.totalPages || 1}
        sort={params.sort}
        params={params}
        onParamsChange={setParams}
        loading={isLoading}
        filters={filters}
        filterOptions={filterOptions}
        onBulkAction={bulkAction ? handleBulk : undefined}
      />
    </div>
  );
}
