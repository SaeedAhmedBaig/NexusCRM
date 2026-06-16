'use client';

import { Suspense, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Play, RotateCcw } from 'lucide-react';
import { automationApi } from '../../../lib/extensions-api';
import { notifyError, notifySuccess } from '../../../lib/notify';
import { PageHeader } from '../../../components/ui/page-header';
import { Button } from '../../../components/ui/button';
import { Spinner } from '../../../components/ui/spinner';

const TRIGGERS = [
  { value: 'manual', label: 'Manual' },
  { value: 'lead_created', label: 'Lead created' },
  { value: 'deal_stage_changed', label: 'Deal stage changed' },
  { value: 'ticket_created', label: 'Ticket created' },
  { value: 'form_submitted', label: 'Form submitted' },
];

const ACTIONS = [
  { value: 'notify', label: 'Notify / activity event' },
  { value: 'create_task', label: 'Create task' },
  { value: 'create_ticket', label: 'Create ticket' },
  { value: 'update_record', label: 'Update record' },
  { value: 'assign_owner', label: 'Assign owner' },
  { value: 'add_tag', label: 'Add tag' },
  { value: 'send_email', label: 'Send email' },
  { value: 'send_sms', label: 'Send SMS' },
  { value: 'apply_ticket_macro', label: 'Apply ticket macro' },
  { value: 'call_webhook', label: 'Call webhook' },
];

const DEFAULT_FORM = {
  name: '',
  description: '',
  status: 'inactive',
  trigger: 'manual',
  action: 'notify',
  conditionMode: 'all',
  conditions: '[]',
  actions: '[\n  { "type": "notify", "config": { "message": "Automation evaluated" } }\n]',
  retryPolicy: '{\n  "maxAttempts": 3,\n  "delayMinutes": 5\n}',
};

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : 'Never';
}

function safeJson(text, fallback) {
  try {
    return text ? JSON.parse(text) : fallback;
  } catch {
    return fallback;
  }
}

function statusTone(status) {
  if (status === 'succeeded') return 'bg-success-light text-success';
  if (status === 'failed') return 'bg-danger-light text-danger';
  if (status === 'retry_scheduled') return 'bg-warning-light text-warning';
  if (status === 'skipped') return 'bg-muted text-muted-foreground';
  return 'bg-brand-light text-brand-dark';
}

function Inner() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [selectedRuleId, setSelectedRuleId] = useState(null);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [runInput, setRunInput] = useState('{\n  "record": {}\n}');

  const { data: rulesPage, isLoading } = useQuery({
    queryKey: ['automation-rules'],
    queryFn: () => automationApi.list({ limit: 100 }),
  });

  const rules = useMemo(() => rulesPage?.data || [], [rulesPage]);
  const selectedRule = useMemo(() => rules.find((rule) => rule.id === selectedRuleId) || rules[0], [rules, selectedRuleId]);

  const { data: runsPage, isLoading: runsLoading } = useQuery({
    queryKey: ['automation-runs', selectedRule?.id],
    queryFn: () => automationApi.runs({ limit: 25, ruleId: selectedRule?.id }),
    enabled: Boolean(selectedRule?.id),
    refetchInterval: 10_000,
  });

  const runs = runsPage?.data || [];
  const selectedRun = runs.find((run) => run.id === selectedRunId) || runs[0];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
    queryClient.invalidateQueries({ queryKey: ['automation-runs'] });
  };

  const createMutation = useMutation({
    mutationFn: () => automationApi.create({
      name: form.name,
      description: form.description,
      status: form.status,
      trigger: form.trigger,
      action: form.action,
      conditionMode: form.conditionMode,
      conditions: safeJson(form.conditions, []),
      actions: safeJson(form.actions, []),
      retryPolicy: safeJson(form.retryPolicy, { maxAttempts: 3, delayMinutes: 5 }),
    }),
    onSuccess: (rule) => {
      invalidate();
      setSelectedRuleId(rule.id);
      setForm(DEFAULT_FORM);
      notifySuccess('Automation rule created');
    },
    onError: notifyError,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => automationApi.update(id, payload),
    onSuccess: () => {
      invalidate();
      notifySuccess('Automation rule updated');
    },
    onError: notifyError,
  });

  const runMutation = useMutation({
    mutationFn: ({ id, dryRun }) => automationApi.run(id, {
      testRun: dryRun,
      dryRun,
      input: safeJson(runInput, {}),
    }),
    onSuccess: (run) => {
      invalidate();
      setSelectedRunId(run.id);
      notifySuccess(run.status === 'succeeded' ? 'Automation executed' : `Automation ${run.status}`);
    },
    onError: notifyError,
  });

  const retryMutation = useMutation({
    mutationFn: (id) => automationApi.retryRun(id, { dryRun: false }),
    onSuccess: (run) => {
      invalidate();
      setSelectedRunId(run.id);
      notifySuccess('Automation retry started');
    },
    onError: notifyError,
  });

  function updateSelectedRule(patch) {
    if (!selectedRule) return;
    updateMutation.mutate({ id: selectedRule.id, payload: patch });
  }

  if (isLoading) return <div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automation Runtime"
        description="Build executable workflow rules with triggers, conditions, actions, run logs, retries, and test execution."
      />

      <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        <section className="space-y-4">
          <form
            className="border border-border bg-card p-4"
            onSubmit={(event) => {
              event.preventDefault();
              createMutation.mutate();
            }}
          >
            <h2 className="text-sm font-bold text-foreground">New workflow rule</h2>
            <div className="mt-4 space-y-3">
              <input className="input-base" value={form.name} onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))} placeholder="Rule name" required />
              <textarea className="input-base min-h-[72px]" value={form.description} onChange={(event) => setForm((state) => ({ ...state, description: event.target.value }))} placeholder="What this automation does..." />
              <div className="grid grid-cols-2 gap-2">
                <select className="input-base" value={form.trigger} onChange={(event) => setForm((state) => ({ ...state, trigger: event.target.value }))}>
                  {TRIGGERS.map((trigger) => <option key={trigger.value} value={trigger.value}>{trigger.label}</option>)}
                </select>
                <select className="input-base" value={form.status} onChange={(event) => setForm((state) => ({ ...state, status: event.target.value }))}>
                  <option value="inactive">Inactive</option>
                  <option value="active">Active</option>
                </select>
              </div>
              <select className="input-base" value={form.action} onChange={(event) => setForm((state) => ({ ...state, action: event.target.value }))}>
                {ACTIONS.map((action) => <option key={action.value} value={action.value}>{action.label}</option>)}
              </select>
              <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Conditions JSON
                <textarea className="input-base mt-1 min-h-[96px] font-mono text-xs" value={form.conditions} onChange={(event) => setForm((state) => ({ ...state, conditions: event.target.value }))} />
              </label>
              <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Actions JSON
                <textarea className="input-base mt-1 min-h-[132px] font-mono text-xs" value={form.actions} onChange={(event) => setForm((state) => ({ ...state, actions: event.target.value }))} />
              </label>
              <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Retry policy
                <textarea className="input-base mt-1 min-h-[76px] font-mono text-xs" value={form.retryPolicy} onChange={(event) => setForm((state) => ({ ...state, retryPolicy: event.target.value }))} />
              </label>
              <Button type="submit" disabled={createMutation.isPending || !form.name.trim()}>Create rule</Button>
            </div>
          </form>

          <section className="border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-bold text-foreground">Rules</h2>
            </div>
            <div className="divide-y divide-border">
              {rules.map((rule) => (
                <button
                  key={rule.id}
                  type="button"
                  onClick={() => {
                    setSelectedRuleId(rule.id);
                    setSelectedRunId(null);
                  }}
                  className={`block w-full px-4 py-3 text-left hover:bg-muted ${selectedRule?.id === rule.id ? 'bg-muted' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{rule.name}</p>
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase ${rule.status === 'active' ? 'bg-success-light text-success' : 'bg-muted text-muted-foreground'}`}>{rule.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{rule.trigger} · {rule.action} · {rule.runCount || 0} runs</p>
                </button>
              ))}
              {rules.length === 0 ? <p className="px-4 py-6 text-sm text-muted-foreground">No automation rules yet.</p> : null}
            </div>
          </section>
        </section>

        <section className="space-y-5">
          {selectedRule ? (
            <>
              <div className="border border-border bg-card p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold tracking-[-0.03em] text-foreground">{selectedRule.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{selectedRule.description || 'No description'}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Last run: {selectedRule.lastRunStatus || 'never'} · {formatDate(selectedRule.lastRunAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={() => updateSelectedRule({ status: selectedRule.status === 'active' ? 'inactive' : 'active' })}>
                      {selectedRule.status === 'active' ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => runMutation.mutate({ id: selectedRule.id, dryRun: true })} disabled={runMutation.isPending}>
                      <Play className="h-4 w-4" />
                      Test run
                    </Button>
                    <Button type="button" onClick={() => runMutation.mutate({ id: selectedRule.id, dryRun: false })} disabled={runMutation.isPending}>
                      Run now
                    </Button>
                  </div>
                </div>
                <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Runtime input JSON
                  <textarea className="input-base mt-1 min-h-[110px] font-mono text-xs" value={runInput} onChange={(event) => setRunInput(event.target.value)} />
                </label>
              </div>

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
                <section className="border border-border bg-card">
                  <div className="border-b border-border px-4 py-3">
                    <h2 className="text-sm font-bold text-foreground">Run history</h2>
                  </div>
                  {runsLoading ? (
                    <div className="flex p-8 justify-center"><Spinner /></div>
                  ) : (
                    <div className="divide-y divide-border">
                      {runs.map((run) => (
                        <button key={run.id} type="button" onClick={() => setSelectedRunId(run.id)} className={`block w-full px-4 py-3 text-left hover:bg-muted ${selectedRun?.id === run.id ? 'bg-muted' : ''}`}>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground">{run.trigger} → {run.action}</p>
                            <span className={`px-2 py-1 text-[10px] font-bold uppercase ${statusTone(run.status)}`}>{run.status}</span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">Attempt {run.attempt || 1}/{run.maxAttempts || 1} · {formatDate(run.createdAt)}</p>
                        </button>
                      ))}
                      {runs.length === 0 ? <p className="px-4 py-6 text-sm text-muted-foreground">No runs yet. Use Test run to validate this rule.</p> : null}
                    </div>
                  )}
                </section>

                <aside className="border border-border bg-card">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <h2 className="text-sm font-bold text-foreground">Run trace</h2>
                    {selectedRun && ['failed', 'retry_scheduled'].includes(selectedRun.status) ? (
                      <Button type="button" size="sm" variant="outline" onClick={() => retryMutation.mutate(selectedRun.id)} disabled={retryMutation.isPending}>
                        <RotateCcw className="h-4 w-4" />
                        Retry
                      </Button>
                    ) : null}
                  </div>
                  {selectedRun ? (
                    <div className="space-y-3 p-4">
                      <div className={`inline-flex px-2 py-1 text-xs font-bold uppercase ${statusTone(selectedRun.status)}`}>{selectedRun.status}</div>
                      {selectedRun.error ? <p className="rounded-md border border-danger/20 bg-danger-light p-3 text-sm text-danger">{selectedRun.error}</p> : null}
                      <div className="space-y-2">
                        {(selectedRun.logs || []).map((log, index) => (
                          <div key={`${log.at}-${index}`} className="border border-border bg-control p-3">
                            <p className="text-xs font-bold uppercase text-muted-foreground">{log.level} · {formatDate(log.at)}</p>
                            <p className="mt-1 text-sm text-foreground">{log.message}</p>
                            {log.data && Object.keys(log.data).length > 0 ? <pre className="mt-2 overflow-auto bg-muted p-2 text-[11px] text-muted-foreground">{JSON.stringify(log.data, null, 2)}</pre> : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="p-4 text-sm text-muted-foreground">Select a run to inspect execution logs.</p>
                  )}
                </aside>
              </div>
            </>
          ) : (
            <div className="border border-border bg-card p-8 text-sm text-muted-foreground">Create a rule to start building workflow automations.</div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>}>
      <Inner />
    </Suspense>
  );
}
