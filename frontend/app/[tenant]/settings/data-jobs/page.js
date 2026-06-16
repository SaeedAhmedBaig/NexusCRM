'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Database, Plus } from 'lucide-react';
import { createDataJob, listDataJobs } from '../../../../lib/data-jobs-api';
import { PageHeader } from '../../../../components/ui/page-header';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { notifyError, notifySuccess } from '../../../../lib/notify';

const OBJECT_TYPES = ['Lead', 'Contact', 'Company', 'Deal', 'Ticket', 'Invoice', 'Quotation', 'Order', 'Product'];
const JOB_TYPES = ['import', 'export', 'report_export', 'sync', 'enrichment'];
const STATUSES = ['', 'queued', 'running', 'completed', 'failed', 'cancelled'];

const initialForm = {
  type: 'export',
  objectType: 'Lead',
  name: '',
  fileName: '',
};

export default function DataJobsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ status: '', type: '' });
  const [form, setForm] = useState(initialForm);

  const { data, isLoading, error } = useQuery({
    queryKey: ['data-jobs', filters],
    queryFn: () => listDataJobs({ ...filters, limit: 50 }),
  });

  const createMutation = useMutation({
    mutationFn: createDataJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-jobs'] });
      setForm(initialForm);
      notifySuccess('Data job queued');
    },
    onError: notifyError,
  });

  function submit(e) {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      name: form.name || `${form.type} ${form.objectType}`,
    });
  }

  const jobs = data?.data || [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Data jobs"
        description="Track imports, exports, sync jobs, enrichment runs, and report exports for enterprise data operations."
        badge={
          <span className="inline-flex items-center gap-1 rounded-md bg-brand-light px-2.5 py-1 text-xs font-bold text-brand">
            <Database className="h-3.5 w-3.5" />
            Data operations
          </span>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <form onSubmit={submit} className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-bold text-foreground">Queue a job placeholder</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            This registers the job record now; file processing workers can attach later without changing the audit model.
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
            <Button type="submit" disabled={createMutation.isPending}>
              <Plus className="h-4 w-4" />
              Queue job
            </Button>
          </div>
        </form>

        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">Job registry</h2>
              <p className="text-xs text-muted-foreground">Operational record of background data movement.</p>
            </div>
            <div className="flex flex-wrap gap-2">
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
                      <td className="px-4 py-3 font-semibold text-foreground">{job.status}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {job.processedRows || 0}/{job.totalRows || 0} rows
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(job.createdAt).toLocaleString()}</td>
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
