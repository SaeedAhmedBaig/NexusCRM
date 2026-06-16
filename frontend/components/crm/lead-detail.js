'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, GitBranch, MessageSquare, Repeat2, SearchCheck } from 'lucide-react';
import {
  convertLead,
  getLead,
  getLeadDuplicates,
  listLeadRoutingRules,
  routeLead,
} from '../../lib/crm-api';
import { listEntityActivity } from '../../lib/activity-api';
import { getTenantUrl } from '../../lib/tenant';
import { notifyError, notifySuccess } from '../../lib/notify';
import { ObjectChat } from '../chat/ObjectChat';
import { useSession } from '../providers/session-context';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'duplicates', label: 'Duplicates' },
  { id: 'convert', label: 'Convert' },
  { id: 'activity', label: 'Activity' },
  { id: 'chat', label: 'Chat' },
];

function formatLabel(value) {
  return String(value || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function money(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function dateValue(value) {
  return value ? new Date(value).toLocaleString() : 'Not set';
}

function Pill({ children, tone = 'neutral' }) {
  const tones = {
    converted: 'bg-success-light text-success',
    qualified: 'bg-brand-light text-brand-dark',
    routed: 'bg-success-light text-success',
    no_match: 'bg-warning-light text-warning',
    failed: 'bg-danger-light text-danger',
    neutral: 'bg-muted text-muted-foreground',
  };
  return <span className={`inline-flex px-2.5 py-1 text-xs font-bold ${tones[tone] || tones.neutral}`}>{children}</span>;
}

function Field({ label, value }) {
  return (
    <div className="border border-border bg-control p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value || '—'}</p>
    </div>
  );
}

function buildInitialConversion(lead = {}) {
  return {
    companyName: lead.companyName || lead.company?.name || lead.title || '',
    firstName: lead.firstName || String(lead.title || '').split(' ')[0] || '',
    lastName: lead.lastName || String(lead.title || '').split(' ').slice(1).join(' '),
    jobTitle: lead.jobTitle || '',
    createDeal: true,
    dealTitle: `${lead.title || 'New'} opportunity`,
    dealValue: lead.value || 0,
    dealStage: 'qualified',
    closeDate: '',
    conversionNotes: '',
  };
}

export function LeadDetail({ leadId, subdomain }) {
  const { profile } = useSession();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('overview');
  const [selectedRule, setSelectedRule] = useState('');
  const [conversionForm, setConversionForm] = useState(buildInitialConversion());

  const { data: lead, isLoading, error } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: () => getLead(leadId),
  });

  const { data: duplicatePage, isLoading: duplicatesLoading } = useQuery({
    queryKey: ['lead-duplicates', leadId],
    queryFn: () => getLeadDuplicates(leadId),
    enabled: Boolean(leadId),
  });

  const { data: routingRules = [] } = useQuery({
    queryKey: ['lead-routing-rules'],
    queryFn: listLeadRoutingRules,
    staleTime: 120_000,
  });

  const { data: activityPage } = useQuery({
    queryKey: ['entity-activity', 'Lead', leadId],
    queryFn: () => listEntityActivity('Lead', leadId, { limit: 30 }),
    enabled: tab === 'activity',
  });

  const routeMutation = useMutation({
    mutationFn: () => routeLead(leadId, selectedRule ? { ruleId: selectedRule } : {}),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      queryClient.invalidateQueries({ queryKey: ['lead-duplicates', leadId] });
      queryClient.invalidateQueries({ queryKey: ['entity-activity', 'Lead', leadId] });
      notifySuccess(result.routed ? 'Lead routed' : 'No routing rule matched');
    },
    onError: notifyError,
  });

  const convertMutation = useMutation({
    mutationFn: (payload) => convertLead(leadId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      queryClient.invalidateQueries({ queryKey: ['lead-duplicates', leadId] });
      queryClient.invalidateQueries({ queryKey: ['entity-activity', 'Lead', leadId] });
      notifySuccess('Lead converted');
      setTab('overview');
    },
    onError: notifyError,
  });

  const duplicates = duplicatePage?.candidates || [];
  const activity = useMemo(() => activityPage?.data || activityPage || [], [activityPage]);

  if (isLoading) return <div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>;
  if (error) return <div className="border border-danger/20 bg-danger-light p-6 text-sm text-danger">{error.message}</div>;
  if (!lead) return null;

  function updateConversion(key, value) {
    setConversionForm((current) => ({ ...current, [key]: value }));
  }

  function startConversion() {
    setConversionForm(buildInitialConversion(lead));
    setTab('convert');
  }

  function submitConversion(event) {
    event.preventDefault();
    convertMutation.mutate({
      ...conversionForm,
      dealValue: Number(conversionForm.dealValue) || 0,
      closeDate: conversionForm.closeDate || null,
    });
  }

  return (
    <div className="space-y-5">
      <div className="border border-border bg-card p-5">
        <div className="mb-4">
          <Link href={getTenantUrl(subdomain, '/crm/leads')} className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-dark">
            <ArrowLeft className="h-4 w-4" />
            Back to leads
          </Link>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-[-0.03em] text-foreground">{lead.name || lead.title}</h1>
              <Pill tone={lead.status}>{formatLabel(lead.status)}</Pill>
              <Pill tone={lead.routingStatus}>{formatLabel(lead.routingStatus)}</Pill>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {formatLabel(lead.source)} · {formatLabel(lead.qualificationStage)} · Score {lead.score || 0}/100
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Owner: {lead.owner?.name || 'Unassigned'} · Value: {money(lead.value)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => routeMutation.mutate()} disabled={routeMutation.isPending || lead.status === 'converted'}>
              <GitBranch className="h-4 w-4" />
              {routeMutation.isPending ? 'Routing...' : 'Route lead'}
            </Button>
            <Button type="button" onClick={startConversion} disabled={lead.status === 'converted'}>
              <Repeat2 className="h-4 w-4" />
              Convert
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Field label="Email" value={lead.email} />
        <Field label="Phone" value={lead.phone} />
        <Field label="Company" value={lead.companyName || lead.company?.name} />
        <Field label="Routed at" value={dateValue(lead.routedAt)} />
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
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="border border-border bg-card p-4">
            <h2 className="text-sm font-bold text-foreground">Qualification</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Stage" value={formatLabel(lead.qualificationStage)} />
              <Field label="Lead score" value={`${lead.score || 0}/100`} />
              <Field label="Fit" value={lead.scoreBreakdown?.fit ?? 0} />
              <Field label="Engagement" value={lead.scoreBreakdown?.engagement ?? 0} />
            </div>
          </section>

          <section className="border border-border bg-card p-4">
            <h2 className="text-sm font-bold text-foreground">Conversion result</h2>
            <div className="mt-4 space-y-3 text-sm">
              <p><span className="font-semibold text-foreground">Account:</span> <span className="text-muted-foreground">{lead.convertedCompany?.name || lead.company?.name || 'Not converted'}</span></p>
              <p><span className="font-semibold text-foreground">Contact:</span> <span className="text-muted-foreground">{lead.convertedContact?.name || lead.contact?.name || 'Not converted'}</span></p>
              <p><span className="font-semibold text-foreground">Opportunity:</span> <span className="text-muted-foreground">{lead.convertedDeal?.name || 'Not created'}</span></p>
              <p><span className="font-semibold text-foreground">Converted at:</span> <span className="text-muted-foreground">{dateValue(lead.convertedAt)}</span></p>
            </div>
          </section>
        </div>
      )}

      {tab === 'duplicates' && (
        <section className="border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <SearchCheck className="h-4 w-4 text-brand" />
            <div>
              <h2 className="text-sm font-bold text-foreground">Duplicate candidates</h2>
              <p className="text-xs text-muted-foreground">Ranked by email, phone, company, and title similarity.</p>
            </div>
          </div>
          {duplicatesLoading ? (
            <p className="p-4 text-sm text-muted-foreground">Checking duplicates...</p>
          ) : duplicates.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No likely duplicate records found.</p>
          ) : (
            <div className="divide-y divide-border">
              {duplicates.map((candidate) => (
                <div key={`${candidate.type}-${candidate.id}`} className="grid gap-3 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{candidate.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {candidate.type} · {candidate.email || candidate.phone || candidate.companyName || 'No contact value'} · {candidate.reasons.join(', ') || 'Similarity match'}
                    </p>
                  </div>
                  <Pill>{candidate.confidence}% match</Pill>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'convert' && (
        <form onSubmit={submitConversion} className="space-y-5 border border-border bg-card p-5">
          <div>
            <h2 className="text-sm font-bold text-foreground">Conversion wizard</h2>
            <p className="mt-1 text-sm text-muted-foreground">Create or reuse account/contact records and optionally create an opportunity.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold text-foreground">Company name</span>
              <input className="input-base" value={conversionForm.companyName} onChange={(e) => updateConversion('companyName', e.target.value)} required />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold text-foreground">Job title</span>
              <input className="input-base" value={conversionForm.jobTitle} onChange={(e) => updateConversion('jobTitle', e.target.value)} />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold text-foreground">First name</span>
              <input className="input-base" value={conversionForm.firstName} onChange={(e) => updateConversion('firstName', e.target.value)} required />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold text-foreground">Last name</span>
              <input className="input-base" value={conversionForm.lastName} onChange={(e) => updateConversion('lastName', e.target.value)} />
            </label>
          </div>

          <div className="border border-border bg-muted p-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <input type="checkbox" checked={conversionForm.createDeal} onChange={(e) => updateConversion('createDeal', e.target.checked)} />
              Create opportunity
            </label>
            {conversionForm.createDeal && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-foreground">Opportunity title</span>
                  <input className="input-base" value={conversionForm.dealTitle} onChange={(e) => updateConversion('dealTitle', e.target.value)} />
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-foreground">Value</span>
                  <input className="input-base" type="number" value={conversionForm.dealValue} onChange={(e) => updateConversion('dealValue', e.target.value)} />
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-foreground">Stage</span>
                  <select className="input-base" value={conversionForm.dealStage} onChange={(e) => updateConversion('dealStage', e.target.value)}>
                    {['lead', 'qualified', 'proposal', 'negotiation'].map((stage) => <option key={stage} value={stage}>{formatLabel(stage)}</option>)}
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-foreground">Close date</span>
                  <input className="input-base" type="date" value={conversionForm.closeDate} onChange={(e) => updateConversion('closeDate', e.target.value)} />
                </label>
              </div>
            )}
          </div>

          <label className="grid gap-1.5 text-sm">
            <span className="font-semibold text-foreground">Conversion notes</span>
            <textarea className="input-base min-h-[96px]" value={conversionForm.conversionNotes} onChange={(e) => updateConversion('conversionNotes', e.target.value)} />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={convertMutation.isPending || lead.status === 'converted'}>
              {convertMutation.isPending ? 'Converting...' : 'Convert lead'}
            </Button>
            <select className="input-base h-10 max-w-sm" value={selectedRule} onChange={(e) => setSelectedRule(e.target.value)}>
              <option value="">Auto-select routing rule</option>
              {routingRules.map((rule) => <option key={rule.id} value={rule.id}>{rule.name}</option>)}
            </select>
            <Button type="button" variant="outline" onClick={() => routeMutation.mutate()} disabled={routeMutation.isPending || lead.status === 'converted'}>
              Run routing
            </Button>
          </div>
        </form>
      )}

      {tab === 'activity' && (
        <section className="border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-bold text-foreground">Lead activity</h2>
          </div>
          {activity.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No activity recorded for this lead yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {activity.map((event) => (
                <li key={event.id} className="px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">{event.summary}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{event.actorName || 'System'} · {dateValue(event.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === 'chat' && (
        <section className="border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-brand" />
            <div>
              <h2 className="text-sm font-bold text-foreground">Lead collaboration</h2>
              <p className="text-xs text-muted-foreground">Internal discussion tied to this lead.</p>
            </div>
          </div>
          <ObjectChat
            entityType="Lead"
            objectId={leadId}
            currentUserId={profile?.user?.id}
            currentUserName={profile?.user?.name}
          />
        </section>
      )}
    </div>
  );
}
