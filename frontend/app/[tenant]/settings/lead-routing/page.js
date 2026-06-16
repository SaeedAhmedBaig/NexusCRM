'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GitBranch, Plus, Trash2 } from 'lucide-react';
import {
  createLeadRoutingRule,
  deleteLeadRoutingRule,
  listLeadRoutingRules,
  updateLeadRoutingRule,
} from '../../../../lib/crm-api';
import { listDepartments, listTenantUsers } from '../../../../lib/api';
import { notifyError, notifySuccess } from '../../../../lib/notify';
import { SettingsButton, SettingsPageShell, SettingsPrimaryButton, SettingsSection } from '../../../../components/settings/settings-layout';

const LEAD_SOURCES = ['website', 'referral', 'cold_call', 'trade_show', 'partner', 'other'];
const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'unqualified'];
const QUALIFICATION_STAGES = ['raw', 'mql', 'sql', 'accepted', 'rejected', 'recycled'];
const STRATEGIES = [
  { value: 'fixed_owner', label: 'Fixed owner' },
  { value: 'department_round_robin', label: 'Department round robin' },
  { value: 'department_pool', label: 'Department pool' },
];

const initialForm = {
  name: '',
  description: '',
  priority: 100,
  active: true,
  strategy: 'fixed_owner',
  assignedTo: '',
  departmentId: '',
  sources: '',
  statuses: '',
  qualificationStages: '',
  minValue: '',
  maxValue: '',
  criteriaDepartmentId: '',
  keywords: '',
};

function csvToArray(value) {
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
}

function arrayToCsv(value) {
  return Array.isArray(value) ? value.join(', ') : '';
}

function ruleToForm(rule) {
  return {
    name: rule.name || '',
    description: rule.description || '',
    priority: rule.priority ?? 100,
    active: rule.active !== false,
    strategy: rule.strategy || 'fixed_owner',
    assignedTo: rule.assignedTo || rule.owner?.id || '',
    departmentId: rule.departmentId || rule.department?.id || '',
    sources: arrayToCsv(rule.criteria?.sources),
    statuses: arrayToCsv(rule.criteria?.statuses),
    qualificationStages: arrayToCsv(rule.criteria?.qualificationStages),
    minValue: rule.criteria?.minValue ?? '',
    maxValue: rule.criteria?.maxValue ?? '',
    criteriaDepartmentId: rule.criteria?.departmentId || '',
    keywords: arrayToCsv(rule.criteria?.keywords),
  };
}

function buildPayload(form) {
  return {
    name: form.name,
    description: form.description,
    priority: Number(form.priority) || 100,
    active: form.active,
    strategy: form.strategy,
    assignedTo: form.strategy === 'fixed_owner' ? form.assignedTo || null : null,
    departmentId: form.departmentId || null,
    criteria: {
      sources: csvToArray(form.sources),
      statuses: csvToArray(form.statuses),
      qualificationStages: csvToArray(form.qualificationStages),
      minValue: form.minValue === '' ? null : Number(form.minValue),
      maxValue: form.maxValue === '' ? null : Number(form.maxValue),
      departmentId: form.criteriaDepartmentId || null,
      keywords: csvToArray(form.keywords),
    },
  };
}

export default function LeadRoutingSettingsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const { data: rules = [], isLoading, error } = useQuery({
    queryKey: ['lead-routing-rules'],
    queryFn: listLeadRoutingRules,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: listDepartments,
    staleTime: 120_000,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['tenant-users'],
    queryFn: () => listTenantUsers(),
    staleTime: 120_000,
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => editingId ? updateLeadRoutingRule(editingId, payload) : createLeadRoutingRule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-routing-rules'] });
      setForm(initialForm);
      setEditingId(null);
      notifySuccess(editingId ? 'Routing rule updated' : 'Routing rule created');
    },
    onError: notifyError,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLeadRoutingRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-routing-rules'] });
      notifySuccess('Routing rule deleted');
    },
    onError: notifyError,
  });

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event) {
    event.preventDefault();
    saveMutation.mutate(buildPayload(form));
  }

  function editRule(rule) {
    setEditingId(rule.id);
    setForm(ruleToForm(rule));
  }

  return (
    <SettingsPageShell
      title="Lead routing"
      description="Configure tenant-scoped assignment rules for inbound and outbound leads."
      actions={
        <SettingsPrimaryButton type="submit" form="lead-routing-rule-form" disabled={saveMutation.isPending}>
          <Plus className="h-4 w-4" />
          {editingId ? 'Save rule' : 'Add rule'}
        </SettingsPrimaryButton>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <form id="lead-routing-rule-form" onSubmit={submit} className="border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-brand" />
            <h2 className="text-sm font-bold text-foreground">{editingId ? 'Edit routing rule' : 'New routing rule'}</h2>
          </div>
          <div className="mt-4 grid gap-3">
            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold text-foreground">Rule name</span>
              <input className="input-base" value={form.name} onChange={(e) => updateField('name', e.target.value)} required />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold text-foreground">Description</span>
              <textarea className="input-base min-h-[72px]" value={form.description} onChange={(e) => updateField('description', e.target.value)} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm">
                <span className="font-semibold text-foreground">Priority</span>
                <input className="input-base" type="number" value={form.priority} onChange={(e) => updateField('priority', e.target.value)} />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-semibold text-foreground">Strategy</span>
                <select className="input-base" value={form.strategy} onChange={(e) => updateField('strategy', e.target.value)}>
                  {STRATEGIES.map((strategy) => <option key={strategy.value} value={strategy.value}>{strategy.label}</option>)}
                </select>
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <input type="checkbox" checked={form.active} onChange={(e) => updateField('active', e.target.checked)} />
              Active
            </label>

            <SettingsSection title="Assignment" description="Choose a fixed owner or department-based assignment target.">
              <div className="grid gap-3 p-3">
                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-foreground">Owner</span>
                  <select className="input-base" value={form.assignedTo} onChange={(e) => updateField('assignedTo', e.target.value)} disabled={form.strategy !== 'fixed_owner'}>
                    <option value="">No fixed owner</option>
                    {users.map((user) => <option key={user.userId || user.id} value={user.userId || user.id}>{user.name || user.email}</option>)}
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-foreground">Assignment department</span>
                  <select className="input-base" value={form.departmentId} onChange={(e) => updateField('departmentId', e.target.value)}>
                    <option value="">No department</option>
                    {departments.map((department) => <option key={department.id || department._id} value={department.id || department._id}>{department.name}</option>)}
                  </select>
                </label>
              </div>
            </SettingsSection>

            <SettingsSection title="Criteria" description="Comma-separated values are treated as OR matches within each field.">
              <div className="grid gap-3 p-3">
                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-foreground">Sources</span>
                  <input className="input-base" value={form.sources} onChange={(e) => updateField('sources', e.target.value)} placeholder={LEAD_SOURCES.join(', ')} />
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-foreground">Statuses</span>
                  <input className="input-base" value={form.statuses} onChange={(e) => updateField('statuses', e.target.value)} placeholder={LEAD_STATUSES.join(', ')} />
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-foreground">Qualification stages</span>
                  <input className="input-base" value={form.qualificationStages} onChange={(e) => updateField('qualificationStages', e.target.value)} placeholder={QUALIFICATION_STAGES.join(', ')} />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-sm">
                    <span className="font-semibold text-foreground">Min value</span>
                    <input className="input-base" type="number" value={form.minValue} onChange={(e) => updateField('minValue', e.target.value)} />
                  </label>
                  <label className="grid gap-1.5 text-sm">
                    <span className="font-semibold text-foreground">Max value</span>
                    <input className="input-base" type="number" value={form.maxValue} onChange={(e) => updateField('maxValue', e.target.value)} />
                  </label>
                </div>
                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-foreground">Criteria department</span>
                  <select className="input-base" value={form.criteriaDepartmentId} onChange={(e) => updateField('criteriaDepartmentId', e.target.value)}>
                    <option value="">Any department</option>
                    {departments.map((department) => <option key={department.id || department._id} value={department.id || department._id}>{department.name}</option>)}
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-foreground">Keywords</span>
                  <input className="input-base" value={form.keywords} onChange={(e) => updateField('keywords', e.target.value)} placeholder="enterprise, partner, demo" />
                </label>
              </div>
            </SettingsSection>

            {editingId && (
              <SettingsButton type="button" onClick={() => { setEditingId(null); setForm(initialForm); }}>
                Cancel editing
              </SettingsButton>
            )}
          </div>
        </form>

        <div className="border border-border bg-card">
          <div className="border-b border-border p-4">
            <h2 className="text-sm font-bold text-foreground">Routing rules</h2>
            <p className="text-xs text-muted-foreground">Rules run by ascending priority. The first active match wins.</p>
          </div>
          {error ? (
            <p className="p-4 text-sm text-danger">{error.message}</p>
          ) : isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">Loading routing rules...</p>
          ) : rules.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No routing rules configured yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {rules.map((rule) => (
                <div key={rule.id} className="grid gap-3 px-4 py-3 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{rule.name}</p>
                      <span className="border border-border bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">Priority {rule.priority}</span>
                      <span className="border border-border bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">{rule.active ? 'Active' : 'Inactive'}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {rule.description || 'No description'} · {rule.owner?.name || 'No fixed owner'} · {rule.department?.name || 'No department'} · {rule.runCount || 0} run(s)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <SettingsButton type="button" onClick={() => editRule(rule)}>Edit</SettingsButton>
                    <SettingsButton type="button" onClick={() => deleteMutation.mutate(rule.id)} disabled={deleteMutation.isPending}>
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </SettingsButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SettingsPageShell>
  );
}
