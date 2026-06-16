'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Building2, MessageSquare, Pencil } from 'lucide-react';
import { getCompany360, updateCompanyAccountPlan } from '../../lib/crm-api';
import { getTenantUrl } from '../../lib/tenant';
import { notifyError, notifySuccess } from '../../lib/notify';
import { ObjectChat } from '../chat/ObjectChat';
import { useSession } from '../providers/session-context';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'plan', label: 'Account plan' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'activity', label: 'Activity' },
  { id: 'chat', label: 'Chat' },
];

const LIFECYCLE_STAGES = ['target', 'prospect', 'qualified', 'active_customer', 'at_risk', 'renewal', 'churned', 'reactivation'];
const HEALTH_STATUSES = ['unknown', 'healthy', 'neutral', 'at_risk', 'critical'];
const ACCOUNT_TIERS = ['standard', 'strategic', 'enterprise', 'vip'];
const CHANNELS = ['email', 'phone', 'sms', 'chat', 'none'];

function formatLabel(value) {
  return String(value || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function currency(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function dateValue(value) {
  return value ? new Date(value).toLocaleDateString() : 'Not set';
}

function Pill({ children, tone = 'neutral' }) {
  const classes = {
    healthy: 'bg-success-light text-success',
    neutral: 'bg-muted text-muted-foreground',
    at_risk: 'bg-warning-light text-warning',
    critical: 'bg-danger-light text-danger',
    unknown: 'bg-muted text-muted-foreground',
    neutralTone: 'bg-muted text-muted-foreground',
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${classes[tone] || classes.neutralTone}`}>
      {children}
    </span>
  );
}

function MetricCard({ label, value, hint }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function RelatedTable({ title, rows, columns, emptyText }) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
      </div>
      {rows.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border bg-muted text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className="px-4 py-3">{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border/70 last:border-0">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 text-foreground">
                      {column.render ? column.render(row) : row[column.key] || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function buildPlanForm(account = {}) {
  return {
    lifecycleStage: account.lifecycleStage || 'prospect',
    healthScore: account.healthScore ?? 50,
    healthStatus: account.healthStatus || 'unknown',
    accountTier: account.accountTier || 'standard',
    renewalDate: account.renewalDate ? String(account.renewalDate).slice(0, 10) : '',
    ownerNotes: account.ownerNotes || '',
    accountPlan: {
      goals: account.accountPlan?.goals || '',
      successCriteria: account.accountPlan?.successCriteria || '',
      risks: account.accountPlan?.risks || '',
      nextSteps: account.accountPlan?.nextSteps || '',
      stakeholders: account.accountPlan?.stakeholders || '',
      renewalStrategy: account.accountPlan?.renewalStrategy || '',
    },
    communicationPreferences: {
      emailOptIn: account.communicationPreferences?.emailOptIn !== false,
      smsOptIn: Boolean(account.communicationPreferences?.smsOptIn),
      doNotContact: Boolean(account.communicationPreferences?.doNotContact),
      preferredChannel: account.communicationPreferences?.preferredChannel || 'email',
      notes: account.communicationPreferences?.notes || '',
    },
  };
}

export function AccountDetail({ companyId, subdomain }) {
  const { profile } = useSession();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('overview');
  const [editingPlan, setEditingPlan] = useState(false);
  const [planForm, setPlanForm] = useState(buildPlanForm());

  const { data, isLoading, error } = useQuery({
    queryKey: ['company-360', companyId],
    queryFn: () => getCompany360(companyId),
  });

  const account = data?.account;
  const metrics = useMemo(() => data?.metrics || {}, [data?.metrics]);

  const updatePlanMutation = useMutation({
    mutationFn: (payload) => updateCompanyAccountPlan(companyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-360', companyId] });
      notifySuccess('Account plan updated');
      setEditingPlan(false);
    },
    onError: notifyError,
  });

  const metricCards = useMemo(() => [
    { label: 'Pipeline', value: currency(metrics.pipelineValue), hint: `${metrics.openDeals || 0} open deal(s)` },
    { label: 'Won revenue', value: currency(metrics.wonRevenue), hint: `${metrics.wonDeals || 0} won deal(s)` },
    { label: 'Contacts', value: metrics.activeContacts || 0, hint: `${metrics.contacts || 0} total contact(s)` },
    { label: 'Service risk', value: metrics.openTickets || 0, hint: `${metrics.overdueInvoices || 0} overdue invoice(s)` },
  ], [metrics]);

  if (isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>;
  }

  if (error) {
    return <div className="rounded-lg border border-danger/20 bg-danger-light p-6 text-sm text-danger">{error.message}</div>;
  }

  if (!account) return null;

  function updatePlanField(key, value) {
    setPlanForm((current) => ({ ...current, [key]: value }));
  }

  function updateNested(section, key, value) {
    setPlanForm((current) => ({
      ...current,
      [section]: { ...current[section], [key]: value },
    }));
  }

  function startPlanEdit() {
    setPlanForm(buildPlanForm(account));
    setEditingPlan(true);
    setTab('plan');
  }

  function submitPlan(event) {
    event.preventDefault();
    updatePlanMutation.mutate({
      ...planForm,
      healthScore: Number(planForm.healthScore) || 0,
      renewalDate: planForm.renewalDate || null,
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="mb-4">
          <Link href={getTenantUrl(subdomain, '/crm/companies')} className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-dark">
            <ArrowLeft className="h-4 w-4" />
            Back to accounts
          </Link>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Building2 className="h-5 w-5 text-brand" />
              <h1 className="text-2xl font-bold tracking-[-0.03em] text-foreground">{account.name}</h1>
              <Pill tone={account.healthStatus}>{formatLabel(account.healthStatus)}</Pill>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {account.industry || 'No industry set'} · {formatLabel(account.lifecycleStage)} · {formatLabel(account.accountTier)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Owner: {account.owner?.name || 'Unassigned'} · Last touch: {dateValue(metrics.lastTouchDate)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={startPlanEdit}>
              <Pencil className="h-4 w-4" />
              Edit account plan
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => <MetricCard key={card.label} {...card} />)}
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`border-b-2 px-3 py-2 text-sm font-semibold ${
              tab === item.id ? 'border-brand text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-bold text-foreground">Account snapshot</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ['Website', account.website || '—'],
                ['Phone', account.phone || '—'],
                ['Status', formatLabel(account.status)],
                ['Renewal date', dateValue(account.renewalDate)],
                ['Parent account', account.parentCompany?.name || '—'],
                ['Health score', `${account.healthScore ?? 0}/100`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-border bg-control p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-bold text-foreground">Account plan summary</h2>
            <div className="mt-4 space-y-3 text-sm">
              <p><span className="font-semibold text-foreground">Goals:</span> <span className="text-muted-foreground">{account.accountPlan?.goals || 'Not defined'}</span></p>
              <p><span className="font-semibold text-foreground">Risks:</span> <span className="text-muted-foreground">{account.accountPlan?.risks || 'No risks recorded'}</span></p>
              <p><span className="font-semibold text-foreground">Next steps:</span> <span className="text-muted-foreground">{account.accountPlan?.nextSteps || 'No next steps recorded'}</span></p>
              <p><span className="font-semibold text-foreground">Owner notes:</span> <span className="text-muted-foreground">{account.ownerNotes || 'No owner notes yet'}</span></p>
            </div>
          </section>
        </div>
      )}

      {tab === 'plan' && (
        <section className="rounded-lg border border-border bg-card p-5">
          {editingPlan ? (
            <form className="space-y-5" onSubmit={submitPlan}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-foreground">Lifecycle</span>
                  <select className="input-base" value={planForm.lifecycleStage} onChange={(e) => updatePlanField('lifecycleStage', e.target.value)}>
                    {LIFECYCLE_STAGES.map((stage) => <option key={stage} value={stage}>{formatLabel(stage)}</option>)}
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-foreground">Health status</span>
                  <select className="input-base" value={planForm.healthStatus} onChange={(e) => updatePlanField('healthStatus', e.target.value)}>
                    {HEALTH_STATUSES.map((status) => <option key={status} value={status}>{formatLabel(status)}</option>)}
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-foreground">Health score</span>
                  <input className="input-base" type="number" min="0" max="100" value={planForm.healthScore} onChange={(e) => updatePlanField('healthScore', e.target.value)} />
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-foreground">Tier</span>
                  <select className="input-base" value={planForm.accountTier} onChange={(e) => updatePlanField('accountTier', e.target.value)}>
                    {ACCOUNT_TIERS.map((tier) => <option key={tier} value={tier}>{formatLabel(tier)}</option>)}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-foreground">Renewal date</span>
                  <input className="input-base" type="date" value={planForm.renewalDate} onChange={(e) => updatePlanField('renewalDate', e.target.value)} />
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-foreground">Preferred channel</span>
                  <select className="input-base" value={planForm.communicationPreferences.preferredChannel} onChange={(e) => updateNested('communicationPreferences', 'preferredChannel', e.target.value)}>
                    {CHANNELS.map((channel) => <option key={channel} value={channel}>{formatLabel(channel)}</option>)}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {[
                  ['goals', 'Goals'],
                  ['successCriteria', 'Success criteria'],
                  ['risks', 'Risks'],
                  ['nextSteps', 'Next steps'],
                  ['stakeholders', 'Stakeholders'],
                  ['renewalStrategy', 'Renewal strategy'],
                ].map(([key, label]) => (
                  <label key={key} className="grid gap-1.5 text-sm">
                    <span className="font-semibold text-foreground">{label}</span>
                    <textarea className="input-base min-h-[92px]" value={planForm.accountPlan[key]} onChange={(e) => updateNested('accountPlan', key, e.target.value)} />
                  </label>
                ))}
              </div>

              <label className="grid gap-1.5 text-sm">
                <span className="font-semibold text-foreground">Owner notes</span>
                <textarea className="input-base min-h-[92px]" value={planForm.ownerNotes} onChange={(e) => updatePlanField('ownerNotes', e.target.value)} />
              </label>

              <div className="grid gap-2 rounded-md border border-border bg-muted p-3 text-sm sm:grid-cols-3">
                {[
                  ['emailOptIn', 'Email opt-in'],
                  ['smsOptIn', 'SMS opt-in'],
                  ['doNotContact', 'Do not contact'],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2">
                    <input type="checkbox" checked={Boolean(planForm.communicationPreferences[key])} onChange={(e) => updateNested('communicationPreferences', key, e.target.checked)} />
                    {label}
                  </label>
                ))}
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={updatePlanMutation.isPending}>
                  {updatePlanMutation.isPending ? 'Saving...' : 'Save account plan'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingPlan(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-foreground">Account plan</h2>
                  <p className="text-sm text-muted-foreground">Strategic goals, success criteria, risks, stakeholders, and renewal approach.</p>
                </div>
                <Button type="button" variant="outline" onClick={startPlanEdit}>Edit</Button>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {[
                  ['Goals', account.accountPlan?.goals || 'Not defined'],
                  ['Success criteria', account.accountPlan?.successCriteria || 'Not defined'],
                  ['Risks', account.accountPlan?.risks || 'No risks recorded'],
                  ['Next steps', account.accountPlan?.nextSteps || 'No next steps recorded'],
                  ['Stakeholders', account.accountPlan?.stakeholders || 'No stakeholders recorded'],
                  ['Renewal strategy', account.accountPlan?.renewalStrategy || 'No renewal strategy recorded'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md border border-border bg-control p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {tab === 'relationships' && (
        <div className="space-y-5">
          <RelatedTable
            title="Contacts"
            rows={data.contacts || []}
            emptyText="No contacts are linked to this account."
            columns={[
              { key: 'name', label: 'Name' },
              { key: 'email', label: 'Email' },
              { key: 'jobTitle', label: 'Role' },
              { key: 'status', label: 'Status', render: (row) => formatLabel(row.status) },
            ]}
          />
          <RelatedTable
            title="Deals"
            rows={data.deals || []}
            emptyText="No deals are linked to this account."
            columns={[
              { key: 'name', label: 'Deal', render: (row) => <Link className="font-semibold text-brand hover:underline" href={getTenantUrl(subdomain, `/crm/deals/${row.id}`)}>{row.name}</Link> },
              { key: 'stage', label: 'Stage', render: (row) => formatLabel(row.stage) },
              { key: 'status', label: 'Status', render: (row) => formatLabel(row.status) },
              { key: 'value', label: 'Value', render: (row) => currency(row.value) },
            ]}
          />
          <RelatedTable
            title="Service tickets"
            rows={data.tickets || []}
            emptyText="No tickets are linked through this account's contacts or deals."
            columns={[
              { key: 'name', label: 'Ticket' },
              { key: 'priority', label: 'Priority', render: (row) => formatLabel(row.priority) },
              { key: 'status', label: 'Status', render: (row) => formatLabel(row.status) },
              { key: 'slaDueAt', label: 'SLA due', render: (row) => dateValue(row.slaDueAt) },
            ]}
          />
          <RelatedTable
            title="Sales documents"
            rows={[...(data.quotations || []), ...(data.orders || []), ...(data.invoices || [])]}
            emptyText="No sales documents are linked through this account's contacts or deals."
            columns={[
              { key: 'name', label: 'Document' },
              { key: 'status', label: 'Status', render: (row) => formatLabel(row.status) },
              { key: 'amount', label: 'Amount', render: (row) => currency(row.grandTotal || row.amount) },
              { key: 'createdAt', label: 'Created', render: (row) => dateValue(row.createdAt) },
            ]}
          />
        </div>
      )}

      {tab === 'activity' && (
        <section className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-bold text-foreground">Unified activity timeline</h2>
            <p className="text-xs text-muted-foreground">Company events plus related contacts, deals, tickets, and sales documents.</p>
          </div>
          {(data.activity || []).length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No activity has been recorded for this account yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.activity.map((event) => (
                <li key={event.id} className="px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">{event.summary}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {event.actorName || 'System'} · {event.entityType} · {new Date(event.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === 'chat' && (
        <section className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-brand" />
            <div>
              <h2 className="text-sm font-bold text-foreground">Account collaboration</h2>
              <p className="text-xs text-muted-foreground">Internal account chat tied directly to this company record.</p>
            </div>
          </div>
          <ObjectChat
            entityType="Company"
            objectId={companyId}
            currentUserId={profile?.user?.id}
            currentUserName={profile?.user?.name}
          />
        </section>
      )}
    </div>
  );
}
