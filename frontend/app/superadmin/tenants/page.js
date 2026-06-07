'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Building2, RefreshCw } from 'lucide-react';
import { listSuperadminTenants } from '../../../lib/superadmin-api';
import { PageHeader } from '../../../components/ui/page-header';
import { SearchInput } from '../../../components/ui/search-input';
import { StatusBadge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { EmptyState } from '../../../components/ui/empty-state';
import { Spinner } from '../../../components/ui/spinner';
import { cn } from '@/lib/utils';

const PLANS = ['', 'Starter', 'Professional', 'Business', 'Enterprise'];
const STATUSES = ['', 'active', 'trial', 'suspended'];

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

const selectClass =
  'h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-foreground outline-none focus:border-foreground/30 focus:ring-[3px] focus:ring-[var(--ring)]';

export default function SuperadminTenantsPage() {
  const [search, setSearch] = useState('');
  const [plan, setPlan] = useState('');
  const [status, setStatus] = useState('');

  const filters = useMemo(
    () => ({ search: search.trim() || undefined, plan: plan || undefined, status: status || undefined }),
    [search, plan, status],
  );

  const { data: tenants = [], isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['superadmin-tenants', filters],
    queryFn: () => listSuperadminTenants(filters),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="All tenants"
        description="Search, filter, and manage every customer workspace"
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            Refresh
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          className="flex-1"
          placeholder="Search by name or subdomain…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className={selectClass} value={plan} onChange={(e) => setPlan(e.target.value)} aria-label="Filter by plan">
          <option value="">All plans</option>
          {PLANS.filter(Boolean).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {STATUSES.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {error && (
        <p className="rounded-lg border border-danger/20 bg-danger-light px-4 py-3 text-sm text-danger" role="alert">
          {error.message}
        </p>
      )}

      {isLoading ? (
        <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-border bg-card">
          <Spinner />
        </div>
      ) : tenants.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No tenants match your filters"
          description="Try adjusting search or filters, or wait for new signups."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Organization</th>
                  <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Subdomain</th>
                  <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Plan</th>
                  <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Users</th>
                  <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Mail sent</th>
                  <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Status</th>
                  <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Created</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
                  <tr key={t.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link href={`/superadmin/tenants/${t.id}`} className="font-medium text-brand hover:text-brand-dark">
                        {t.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <code className="rounded-md bg-muted px-1.5 py-0.5 text-[12px] text-foreground">{t.subdomain}</code>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{t.plan || '—'}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {t.userCount}
                      {t.limits?.users > 0 && <span className="text-muted-foreground/60"> / {t.limits.users}</span>}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{t.massMailSent.toLocaleString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{formatDate(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-4 py-2.5 text-[12px] text-muted-foreground">
            {tenants.length} workspace{tenants.length === 1 ? '' : 's'}
          </div>
        </div>
      )}
    </div>
  );
}
