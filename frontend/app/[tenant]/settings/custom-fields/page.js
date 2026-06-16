'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { createCustomField, listCustomFields, removeCustomField } from '../../../../lib/metadata-api';
import { PageHeader } from '../../../../components/ui/page-header';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { notifyError, notifySuccess } from '../../../../lib/notify';

const OBJECT_TYPES = [
  'Lead',
  'Contact',
  'Company',
  'Deal',
  'Ticket',
  'Quotation',
  'Order',
  'Invoice',
  'Project',
  'Task',
];

const FIELD_TYPES = [
  'text',
  'textarea',
  'number',
  'currency',
  'date',
  'datetime',
  'select',
  'multiselect',
  'checkbox',
  'url',
  'email',
  'phone',
];

const initialForm = {
  objectType: 'Lead',
  label: '',
  key: '',
  type: 'text',
  section: 'Custom fields',
  required: false,
  searchable: false,
  filterable: true,
  optionsText: '',
};

export default function CustomFieldsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const [objectFilter, setObjectFilter] = useState('');

  const { data: fields = [], isLoading, error } = useQuery({
    queryKey: ['custom-fields', objectFilter],
    queryFn: () => listCustomFields(objectFilter ? { objectType: objectFilter } : {}),
  });

  const createMutation = useMutation({
    mutationFn: createCustomField,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
      setForm(initialForm);
      notifySuccess('Custom field created');
    },
    onError: notifyError,
  });

  const removeMutation = useMutation({
    mutationFn: removeCustomField,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
      notifySuccess('Custom field disabled');
    },
    onError: notifyError,
  });

  function submit(e) {
    e.preventDefault();
    const options = form.optionsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, value] = line.split('|').map((part) => part?.trim());
        return { label, value: value || label };
      });

    createMutation.mutate({
      objectType: form.objectType,
      label: form.label,
      key: form.key,
      type: form.type,
      section: form.section,
      required: form.required,
      searchable: form.searchable,
      filterable: form.filterable,
      options,
    });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Custom fields"
        description="Define tenant-specific fields that can power enterprise layouts, imports, reports, automations, and permissions."
        actions={
          <Button type="submit" form="custom-field-form" disabled={createMutation.isPending}>
            <Plus className="h-4 w-4" />
            Add field
          </Button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <form id="custom-field-form" onSubmit={submit} className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-bold text-foreground">New field definition</h2>
          <div className="mt-4 grid gap-3">
            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold text-foreground">Object</span>
              <select
                value={form.objectType}
                onChange={(e) => setForm({ ...form, objectType: e.target.value })}
                className="h-10 rounded-md border border-border bg-control px-3 text-sm text-foreground"
              >
                {OBJECT_TYPES.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold text-foreground">Label</span>
              <Input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Customer health score"
                required
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold text-foreground">API key</span>
              <Input
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value })}
                placeholder="customer_health_score"
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold text-foreground">Type</span>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="h-10 rounded-md border border-border bg-control px-3 text-sm text-foreground"
              >
                {FIELD_TYPES.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold text-foreground">Section</span>
              <Input
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
                placeholder="Revenue intelligence"
              />
            </label>
            {['select', 'multiselect'].includes(form.type) && (
              <label className="grid gap-1.5 text-sm">
                <span className="font-semibold text-foreground">Options</span>
                <textarea
                  value={form.optionsText}
                  onChange={(e) => setForm({ ...form, optionsText: e.target.value })}
                  placeholder={'Healthy|healthy\nAt risk|at_risk'}
                  className="min-h-28 rounded-md border border-border bg-control px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                />
              </label>
            )}
            <div className="grid gap-2 rounded-md border border-border bg-muted p-3 text-sm">
              {[
                ['required', 'Required'],
                ['searchable', 'Searchable'],
                ['filterable', 'Filterable'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-foreground">
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                    className="rounded border-border"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </form>

        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">Field registry</h2>
              <p className="text-xs text-muted-foreground">Active metadata available for layouts, reports, imports, and automation.</p>
            </div>
            <select
              value={objectFilter}
              onChange={(e) => setObjectFilter(e.target.value)}
              className="h-9 rounded-md border border-border bg-control px-3 text-sm text-foreground"
            >
              <option value="">All objects</option>
              {OBJECT_TYPES.map((type) => <option key={type}>{type}</option>)}
            </select>
          </div>

          {error ? (
            <p className="p-4 text-sm text-danger">{error.message}</p>
          ) : isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">Loading fields...</p>
          ) : fields.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No custom fields defined yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-border bg-muted text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Object</th>
                    <th className="px-4 py-3">Field</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Flags</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field) => (
                    <tr key={field.id} className="border-b border-border/70 last:border-0">
                      <td className="px-4 py-3 font-semibold text-foreground">{field.objectType}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground">{field.label}</p>
                        <p className="text-xs text-muted-foreground">{field.key}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{field.type}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {[
                          field.required && 'required',
                          field.searchable && 'searchable',
                          field.filterable && 'filterable',
                          field.unique && 'unique',
                        ].filter(Boolean).join(', ') || 'standard'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeMutation.mutate(field.id)}
                          className="inline-flex h-8 items-center gap-1 rounded-md border border-danger/30 px-2.5 text-xs font-semibold text-danger hover:bg-danger-light"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Disable
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
