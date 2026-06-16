'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Database, Download, Play, Plus, RefreshCw, RotateCcw, XCircle } from 'lucide-react';
import { createDataJob, listDataJobs, previewDataJob, runDataJob, retryDataJob, cancelDataJob } from '../../../../lib/data-jobs-api';
import { downloadFileAsset } from '../../../../lib/files-api';
import { PageHeader } from '../../../../components/ui/page-header';
import { Input } from '../../../../components/ui/input';
import { notifyError, notifySuccess } from '../../../../lib/notify';
import { SettingsButton, SettingsPrimaryButton } from '../../../../components/settings/settings-layout';
import { Can } from '../../../../components/can';
import { useSession } from '../../../../components/providers/session-context';

const OBJECT_TYPES = ['Lead', 'Contact', 'Company', 'Deal', 'Ticket', 'Invoice', 'Quotation', 'Order', 'Product', 'ActivityEvent'];
const JOB_TYPES = ['import', 'export', 'report_export', 'sync', 'enrichment'];
const STATUSES = ['', 'queued', 'running', 'completed', 'failed', 'cancelled'];
const STATUS_CLASSES = {
  queued: 'bg-warning-light text-warning',
  running: 'bg-brand-light text-brand',
  completed: 'bg-success-light text-success',
  failed: 'bg-danger-light text-danger',
  cancelled: 'bg-muted text-muted-foreground',
};

const initialForm = {
  type: 'export',
  objectType: 'Lead',
  name: '',
  fileName: '',
  content: '',
  mappingJson: '{}',
  optionsJson: '{\n  "format": "csv",\n  "limit": 1000\n}',
};

export default function DataJobsPage() {
  const queryClient = useQueryClient();
  const { profile } = useSession();
  const [filters, setFilters] = useState({ status: '', type: '' });
  const [form, setForm] = useState(initialForm);
  const [selectedJob, setSelectedJob] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['data-jobs', filters],
    queryFn: () => listDataJobs({ ...filters, limit: 50 }),
    refetchInterval: (query) => {
      const rows = query.state.data?.data || [];
      return rows.some((job) => ['queued', 'running'].includes(job.status)) ? 5000 : false;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const job = await createDataJob(payload);
      if (payload.type === 'import' && form.content.trim()) {
        return previewDataJob(job.id, {
          content: form.content,
          fileName: form.fileName || `${form.objectType.toLowerCase()}-import.csv`,
          mapping: JSON.parse(form.mappingJson || '{}'),
          options: JSON.parse(form.optionsJson || '{}'),
        });
      }
      return job;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['data-jobs'] });
      setForm(initialForm);
      notifySuccess(result.rows ? 'Import preview generated' : 'Data job queued');
    },
    onError: notifyError,
  });

  const jobActionMutation = useMutation({
    mutationFn: ({ action, id }) => {
      if (action === 'run') return runDataJob(id);
      if (action === 'retry') return retryDataJob(id);
      if (action === 'cancel') return cancelDataJob(id);
      throw new Error('Unknown action');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-jobs'] });
      notifySuccess('Data job updated');
    },
    onError: notifyError,
  });

  function submit(e) {
    e.preventDefault();
    createMutation.mutate({
      type: form.type,
      objectType: form.objectType,
      name: form.name || `${form.type} ${form.objectType}`,
      fileName: form.fileName,
      mapping: JSON.parse(form.mappingJson || '{}'),
      options: JSON.parse(form.optionsJson || '{}'),
    });
  }

  async function downloadArtifact(fileId) {
    const file = await downloadFileAsset(fileId);
    const url = URL.createObjectURL(file.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  const jobs = data?.data || [];
  const activeCount = jobs.filter((job) => ['queued', 'running'].includes(job.status)).length;

  function progressPercent(job) {
    if (!job.totalRows) return job.status === 'completed' ? 100 : 0;
    return Math.min(Math.round(((job.processedRows || 0) / job.totalRows) * 100), 100);
  }

  return (
    <Can action="manage" subject="DataJob" rules={profile?.rules} fallback={<p className="text-sm text-muted-foreground">You do not have permission to manage data jobs.</p>}>
    <div className="space-y-5">
      <PageHeader
        title="Data jobs"
        description="Track imports, exports, sync jobs, enrichment runs, and report exports for enterprise data operations."
        badge={
          <span className="inline-flex items-center gap-1 rounded-md bg-brand-light px-2.5 py-1 text-xs font-bold text-brand">
            <Database className="h-3.5 w-3.5" />
            {activeCount ? `${activeCount} active` : 'Data operations'}
          </span>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <form onSubmit={submit} className="border border-border bg-card p-4">
          <h2 className="text-sm font-bold text-foreground">Queue a data job</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Register import, export, sync, and enrichment work for the background processing pipeline.
          </p>
          <div className="mt-4 grid gap-3">
            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold text-foreground">Type</span>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="h-10 rounded-md border border-border bg-control px-3 text-sm text-foreground"
              >
                {JOB_TYPES.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
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
              <span className="font-semibold text-foreground">Name</span>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Q2 leads export" />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold text-foreground">File name</span>
              <Input value={form.fileName} onChange={(e) => setForm({ ...form, fileName: e.target.value })} placeholder="leads.csv" />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold text-foreground">Mapping JSON</span>
              <textarea className="input-base min-h-[84px] font-mono text-xs" value={form.mappingJson} onChange={(e) => setForm({ ...form, mappingJson: e.target.value })} />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold text-foreground">Options JSON</span>
              <textarea className="input-base min-h-[84px] font-mono text-xs" value={form.optionsJson} onChange={(e) => setForm({ ...form, optionsJson: e.target.value })} />
            </label>
            {form.type === 'import' && (
              <label className="grid gap-1.5 text-sm">
                <span className="font-semibold text-foreground">CSV or JSON content</span>
                <textarea className="input-base min-h-[132px] font-mono text-xs" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="name,email&#10;Acme,hello@example.com" />
              </label>
            )}
            <SettingsPrimaryButton type="submit" disabled={createMutation.isPending}>
              <Plus className="h-4 w-4" />
              {form.type === 'import' ? 'Queue and preview' : 'Queue job'}
            </SettingsPrimaryButton>
          </div>
        </form>

        <div className="overflow-hidden border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">Job registry</h2>
              <p className="text-xs text-muted-foreground">Operational record of background data movement.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <SettingsButton onClick={() => queryClient.invalidateQueries({ queryKey: ['data-jobs'] })}>
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </SettingsButton>
              <select
                value={filters.type}
                onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
                className="h-9 rounded-md border border-border bg-control px-3 text-sm text-foreground"
              >
                <option value="">All types</option>
                {JOB_TYPES.map((type) => <option key={type}>{type}</option>)}
              </select>
              <select
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                className="h-9 rounded-md border border-border bg-control px-3 text-sm text-foreground"
              >
                {STATUSES.map((status) => <option key={status} value={status}>{status || 'All statuses'}</option>)}
              </select>
            </div>
          </div>

          {error ? (
            <p className="p-4 text-sm text-danger">{error.message}</p>
          ) : isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">Loading data jobs...</p>
          ) : jobs.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No data jobs have been queued yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="border-b border-border bg-muted text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Job</th>
                    <th className="px-4 py-3">Object</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Progress</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-b border-border/70 last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground">{job.name}</p>
                        <p className="text-xs text-muted-foreground">{job.type} · {job.fileName || 'no file attached'}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{job.objectType}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex border px-2.5 py-1 text-xs font-bold capitalize ${STATUS_CLASSES[job.status] || STATUS_CLASSES.queued}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="min-w-40">
                          <div className="h-2 overflow-hidden bg-muted">
                            <div className="h-full bg-brand" style={{ width: `${progressPercent(job)}%` }} />
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {job.processedRows || 0}/{job.totalRows || 0} rows · {job.successRows || 0} ok · {job.failedRows || 0} failed
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(job.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {['queued', 'running'].includes(job.status) && (
                            <>
                            <SettingsButton type="button" onClick={() => setSelectedJob(job)}>
                              Details
                            </SettingsButton>
                            {job.status === 'queued' && (
                              <SettingsButton
                                type="button"
                                disabled={jobActionMutation.isPending}
                                onClick={() => jobActionMutation.mutate({ action: 'run', id: job.id })}
                              >
                                <Play className="h-3.5 w-3.5" />
                                Run
                              </SettingsButton>
                            )}
                            {job.resultFileId && (
                              <SettingsButton type="button" onClick={() => downloadArtifact(job.resultFileId)}>
                                <Download className="h-3.5 w-3.5" />
                                Result
                              </SettingsButton>
                            )}
                            {job.errorFileId && (
                              <SettingsButton type="button" onClick={() => downloadArtifact(job.errorFileId)}>
                                <Download className="h-3.5 w-3.5" />
                                Errors
                              </SettingsButton>
                            )}
                            <SettingsButton
                              type="button"
                              disabled={jobActionMutation.isPending}
                              onClick={() => jobActionMutation.mutate({ action: 'cancel', id: job.id })}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Cancel
                            </SettingsButton>
                            </>
                          )}
                          {['failed', 'cancelled'].includes(job.status) && (
                            <SettingsButton
                              type="button"
                              disabled={jobActionMutation.isPending}
                              onClick={() => jobActionMutation.mutate({ action: 'retry', id: job.id })}
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Retry
                            </SettingsButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {selectedJob && (
        <div className="border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">{selectedJob.name}</h2>
              <p className="text-xs text-muted-foreground">{selectedJob.type} · {selectedJob.objectType} · attempt {selectedJob.attempt || 0}/{selectedJob.maxAttempts || 3}</p>
            </div>
            <SettingsButton onClick={() => setSelectedJob(null)}>Close</SettingsButton>
          </div>
          {selectedJob.previewRows?.length ? (
            <pre className="mt-4 max-h-48 overflow-auto bg-muted p-3 text-xs text-muted-foreground">{JSON.stringify(selectedJob.previewRows, null, 2)}</pre>
          ) : null}
          <div className="mt-4 grid gap-2">
            {(selectedJob.logs || []).map((log, index) => (
              <div key={`${log.at}-${index}`} className="border border-border bg-control p-3 text-xs">
                <p className="font-bold uppercase text-muted-foreground">{log.level} · {log.at ? new Date(log.at).toLocaleString() : ''}</p>
                <p className="mt-1 text-foreground">{log.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    </Can>
  );
}
