'use client';

import { useCallback, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { DataTable } from './DataTable';
import { useListParams } from './use-list-params';
import { listDepartments, listTenantUsers } from '../../lib/api';
import { listEntityActivity } from '../../lib/activity-api';
import { PageHeader } from '../ui/page-header';
import { Button } from '../ui/button';
import { withMutationNotify } from '../../lib/mutation-options';

const ACTIVITY_ENTITY_TYPES = {
  quotations: 'Quotation',
  orders: 'Order',
  invoices: 'Invoice',
  products: 'Product',
  tickets: 'Ticket',
  'ticket-queues': 'TicketQueue',
  'ticket-macros': 'TicketMacro',
  sms: 'SmsCampaign',
  knowledge: 'KnowledgeArticle',
  automation: 'AutomationRule',
  'live-chat': 'LiveChatSession',
};

export function ModuleListPage({
  title,
  description,
  entity,
  columns,
  fetchList,
  getRecord,
  createRecord,
  updateRecord,
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
  const [drawer, setDrawer] = useState({ open: false, mode: 'view', record: null, form: {} });
  const [detailLoading, setDetailLoading] = useState(false);

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

  const activityEntityType = ACTIVITY_ENTITY_TYPES[entity];
  const { data: activityPage } = useQuery({
    queryKey: ['entity-activity', activityEntityType, drawer.record?.id],
    queryFn: () => listEntityActivity(activityEntityType, drawer.record.id, { limit: 8 }),
    enabled: drawer.open && Boolean(activityEntityType && drawer.record?.id),
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

  const updateMutation = useMutation(
    withMutationNotify({
      mutationFn: ({ id, payload }) => updateRecord(id, payload),
      successMessage: 'Record updated',
      onSuccess: (record) => {
        queryClient.invalidateQueries({ queryKey: [entity] });
        setDrawer({ open: true, mode: 'view', record, form: record });
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

  const openRecord = useCallback(
    async (row, mode = 'view') => {
      setDetailLoading(true);
      setDrawer({ open: true, mode, record: row, form: row });
      try {
        const record = getRecord ? await getRecord(row.id) : row;
        setDrawer({ open: true, mode, record, form: record });
      } finally {
        setDetailLoading(false);
      }
    },
    [getRecord],
  );

  function renderFieldInput(field, value, onChange) {
    if (field.type === 'select') {
      return (
        <select className="input-base" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          {(field.options || []).map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      );
    }
    if (field.type === 'textarea') {
      return <textarea className="input-base min-h-[96px]" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
    }
    const inputValue = field.type === 'date' && value ? String(value).slice(0, 10) : value ?? '';
    return <input className="input-base" type={field.type || 'text'} value={inputValue} onChange={(e) => onChange(e.target.value)} />;
  }

  function buildEditablePayload(values) {
    return Object.fromEntries(createFields.map((field) => [field.key, values[field.key]]));
  }

  if (error) {
    return (
      <div className="rounded-md border border-danger/20 bg-danger-light p-6 text-sm text-danger">
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
          className="rounded-lg border border-border bg-card p-5"
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
        onRowClick={(row) => openRecord(row)}
        onRowView={(row) => openRecord(row)}
        onRowEdit={updateRecord ? (row) => openRecord(row, 'edit') : undefined}
      />

      {drawer.open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button type="button" className="absolute inset-0 bg-foreground/25 backdrop-blur-sm" onClick={() => setDrawer({ open: false, mode: 'view', record: null, form: {} })} />
          <aside className="animate-slide-in-right relative flex h-full w-full max-w-xl flex-col border-l border-border bg-card shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-border bg-muted px-6 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                  {drawer.record?.name || drawer.record?.title || 'Record detail'}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {detailLoading ? 'Loading latest record...' : 'View, edit, and govern this CRM record.'}
                </p>
              </div>
              <button type="button" onClick={() => setDrawer({ open: false, mode: 'view', record: null, form: {} })} className="rounded-md p-2 hover:bg-card">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {drawer.mode === 'edit' && updateRecord ? (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateMutation.mutate({ id: drawer.record.id, payload: buildEditablePayload(drawer.form) });
                  }}
                >
                  {createFields.map((field) => (
                    <label key={field.key} className="block text-sm">
                      <span className="mb-1.5 block font-medium text-muted-foreground">{field.label}</span>
                      {renderFieldInput(field, drawer.form[field.key], (value) =>
                        setDrawer((state) => ({ ...state, form: { ...state.form, [field.key]: value } }))
                      )}
                    </label>
                  ))}
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? 'Saving...' : 'Save changes'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setDrawer((state) => ({ ...state, mode: 'view' }))}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {Object.entries(drawer.record || {})
                      .filter(([key, value]) => !['_id', 'id', '__v'].includes(key) && value !== null && value !== undefined && typeof value !== 'object')
                      .slice(0, 12)
                      .map(([key, value]) => (
                        <div key={key} className="rounded-md border border-border bg-control p-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{key.replace(/([A-Z])/g, ' $1')}</p>
                          <p className="mt-1 break-words text-sm font-semibold text-foreground">{String(value)}</p>
                        </div>
                      ))}
                  </div>
                  {updateRecord && (
                    <Button type="button" onClick={() => setDrawer((state) => ({ ...state, mode: 'edit' }))}>
                      Edit record
                    </Button>
                  )}
                  {activityEntityType && (
                    <div className="rounded-lg border border-border bg-card p-4">
                      <div className="mb-3">
                        <p className="text-sm font-bold text-foreground">Recent activity</p>
                        <p className="text-xs text-muted-foreground">Enterprise activity stream for this record.</p>
                      </div>
                      {activityPage?.data?.length ? (
                        <ul className="space-y-2">
                          {activityPage.data.map((event) => (
                            <li key={event.id} className="rounded-md border border-border bg-control px-3 py-2 text-xs">
                              <p className="font-semibold text-foreground">{event.summary}</p>
                              <p className="mt-0.5 text-muted-foreground">
                                {event.actorName || 'System'} · {new Date(event.createdAt).toLocaleString()}
                              </p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No activity has been recorded yet.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
