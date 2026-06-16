'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, Download, Play } from 'lucide-react';
import { reportExportJobsApi } from '../../../../lib/extensions-api';
import { withMutationNotify } from '../../../../lib/mutation-options';
import { PageHeader } from '../../../../components/ui/page-header';
import { Button } from '../../../../components/ui/button';
import { Spinner } from '../../../../components/ui/spinner';

const REPORT_TYPES = [
  { value: 'analytics', label: 'Full analytics' },
  { value: 'sales', label: 'Sales reports' },
  { value: 'customers', label: 'Customer reports' },
  { value: 'team', label: 'Team performance' },
  { value: 'activity', label: 'Audit activity' },
  { value: 'custom', label: 'Custom report' },
];

const FORMATS = [
  { value: 'xlsx', label: 'Excel workbook' },
  { value: 'csv', label: 'CSV file' },
  { value: 'json', label: 'JSON payload' },
];

const STATUS_CLASSES = {
  queued: 'bg-warning-light text-warning',
  running: 'bg-brand-light text-brand',
  completed: 'bg-success-light text-success',
  failed: 'bg-danger-light text-danger',
  cancelled: 'bg-muted text-muted-foreground',
};

function defaultTitle(reportType) {
  const option = REPORT_TYPES.find((item) => item.value === reportType);
  return `${option?.label || 'Analytics'} export`;
}

function statusLabel(status) {
  return String(status || 'queued').replace(/_/g, ' ');
}

function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function ReportExportsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ reportType: 'analytics', format: 'xlsx', title: defaultTitle('analytics') });
  const [filters, setFilters] = useState({ status: '', reportType: '' });
  const params = useMemo(() => ({ ...filters, limit: 50 }), [filters]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['report-export-jobs', params],
    queryFn: () => reportExportJobsApi.list(params),
  });

  const createMutation = useMutation(
    withMutationNotify({
      mutationFn: reportExportJobsApi.create,
      successMessage: 'Export job queued',
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['report-export-jobs'] });
        setForm({ reportType: 'analytics', format: 'xlsx', title: defaultTitle('analytics') });
      },
    }),
  );

  const runMutation = useMutation(
    withMutationNotify({
      mutationFn: (id) => reportExportJobsApi.run(id, { trigger: 'manual' }),
      successMessage: 'Export job prepared',
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['report-export-jobs'] }),
    }),
  );

  const downloadMutation = useMutation(
    withMutationNotify({
      mutationFn: reportExportJobsApi.download,
      successMessage: 'Export downloaded',
      onSuccess: ({ blob, fileName }) => saveBlob(blob, fileName),
    }),
  );

  const jobs = data?.data || [];
  const queuedCount = jobs.filter((job) => ['queued', 'running'].includes(job.status)).length;
  const completedCount = jobs.filter((job) => job.status === 'completed').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Report export queue"
        description="Queue governed report exports, track generation status, and retain a tenant-scoped audit trail for downstream file delivery."
        badge={
          <span className="inline-flex items-center gap-1 rounded-md bg-brand-light px-2.5 py-1 text-xs font-bold text-brand">
            <Archive className="h-3.5 w-3.5" />
            Export jobs
          </span>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-foreground">Queue an export</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                This foundation records the request and prepares a durable job record for a file worker.
              </p>
            </div>
          </div>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              createMutation.mutate(form);
            }}
          >
            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold text-foreground">Report</span>
              <select
                value={form.reportType}
                onChange={(event) => {
                  const reportType = event.target.value;
                  setForm((prev) => ({ ...prev, reportType, title: defaultTitle(reportType) }));
                }}
                className="input-base"
              >
                {REPORT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold text-foreground">Format</span>
              <select
                value={form.format}
                onChange={(event) => setForm((prev) => ({ ...prev, format: event.target.value }))}
                className="input-base"
              >
                {FORMATS.map((format) => (
                  <option key={format.value} value={format.value}>{format.label}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm sm:col-span-2">
              <span className="font-semibold text-foreground">Title</span>
              <input
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                className="input-base"
                required
              />
            </label>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={createMutation.isPending}>
                <Download className="h-4 w-4" />
                {createMutation.isPending ? 'Queueing...' : 'Queue export'}
              </Button>
            </div>
          </form>
        </section>

        <aside className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Queued or running</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{queuedCount}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Prepared exports</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{completedCount}</p>
          </div>
        </aside>
      </div>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="grid gap-3 border-b border-border p-4 sm:grid-cols-3">
          <label className="grid gap-1.5 text-sm">
            <span className="font-semibold text-foreground">Status</span>
            <select
              value={filters.status}
              onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
              className="input-base"
            >
              <option value="">All statuses</option>
              {Object.keys(STATUS_CLASSES).map((status) => (
                <option key={status} value={status}>{statusLabel(status)}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="font-semibold text-foreground">Report</span>
            <select
              value={filters.reportType}
              onChange={(event) => setFilters((prev) => ({ ...prev, reportType: event.target.value }))}
              className="input-base"
            >
              <option value="">All reports</option>
              {REPORT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </label>
          <div className="rounded-md border border-border bg-muted p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Total matching</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{data?.total ?? 0}</p>
          </div>
        </div>

        {error ? (
          <p className="p-4 text-sm text-danger">{error.message}</p>
        ) : isLoading ? (
          <div className="flex min-h-48 items-center justify-center"><Spinner /></div>
        ) : jobs.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No export jobs match these filters yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-border bg-muted text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Export</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Format</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">File</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b border-border/70 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground">{job.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(job.createdAt).toLocaleString()}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{statusLabel(job.reportType)}</td>
                    <td className="px-4 py-3 uppercase text-muted-foreground">{job.format}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${STATUS_CLASSES[job.status] || STATUS_CLASSES.queued}`}>
                        {statusLabel(job.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {job.fileName ? (
                        <div>
                          <p className="font-medium text-foreground">{job.fileName}</p>
                          <p className="text-xs text-muted-foreground">Expires {job.expiresAt ? new Date(job.expiresAt).toLocaleDateString() : 'later'}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not prepared</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {job.status === 'completed' ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={downloadMutation.isPending}
                            onClick={() => downloadMutation.mutate(job.id)}
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={runMutation.isPending}
                            onClick={() => runMutation.mutate(job.id)}
                          >
                            <Play className="h-3.5 w-3.5" />
                            Prepare
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
