'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { listActivity } from '../../../../lib/activity-api';
import { PageHeader } from '../../../../components/ui/page-header';

const ENTITY_TYPES = ['', 'Deal', 'Lead', 'Contact', 'Company', 'Ticket', 'Invoice', 'Quotation', 'Order', 'Product', 'CustomField', 'AutomationRule', 'ReportExportJob'];
const ACTIONS = ['', 'created', 'updated', 'deleted', 'disabled', 'completed', 'payment_added', 'succeeded', 'failed'];

export default function AuditPage() {
  const [filters, setFilters] = useState({ entityType: '', action: '' });
  const { data, isLoading, error } = useQuery({
    queryKey: ['activity-audit', filters],
    queryFn: () => listActivity({ ...filters, limit: 75 }),
  });

  const events = data?.data || [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Security & audit"
        description="Review tenant-scoped activity across CRM records, metadata, automations, sales documents, and service workflows."
        badge={
          <span className="inline-flex items-center gap-1 rounded-md bg-brand-light px-2.5 py-1 text-xs font-bold text-brand">
            <ShieldCheck className="h-3.5 w-3.5" />
            Activity stream
          </span>
        }
      />

      <div className="border border-border bg-card p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1.5 text-sm">
            <span className="font-semibold text-foreground">Object</span>
            <select
              value={filters.entityType}
              onChange={(e) => setFilters((prev) => ({ ...prev, entityType: e.target.value }))}
              className="h-10 rounded-md border border-border bg-control px-3 text-sm text-foreground"
            >
              {ENTITY_TYPES.map((type) => <option key={type} value={type}>{type || 'All objects'}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="font-semibold text-foreground">Action</span>
            <select
              value={filters.action}
              onChange={(e) => setFilters((prev) => ({ ...prev, action: e.target.value }))}
              className="h-10 rounded-md border border-border bg-control px-3 text-sm text-foreground"
            >
              {ACTIONS.map((action) => <option key={action} value={action}>{action || 'All actions'}</option>)}
            </select>
          </label>
          <div className="rounded-md border border-border bg-muted p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Visible events</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{data?.total ?? 0}</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-bold text-foreground">Latest activity events</h2>
        </div>
        {error ? (
          <p className="p-4 text-sm text-danger">{error.message}</p>
        ) : isLoading ? (
          <p className="p-4 text-sm text-muted-foreground">Loading audit events...</p>
        ) : events.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No matching activity events yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-border bg-muted text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Object</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Summary</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-b border-border/70 last:border-0">
                    <td className="px-4 py-3 text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{event.actorName || 'System'}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground">{event.entityType}</p>
                      <p className="text-xs text-muted-foreground">{event.entityName || event.entityId}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{event.action}</td>
                    <td className="px-4 py-3 text-foreground">{event.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
