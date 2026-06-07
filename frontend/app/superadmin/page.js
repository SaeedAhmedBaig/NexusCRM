'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Building2, Users, DollarSign, Mail } from 'lucide-react';
import { getSuperadminStats } from '../../lib/superadmin-api';
import { PageHeader } from '../../components/ui/page-header';
import { Spinner } from '../../components/ui/spinner';
import { Card, CardContent } from '../../components/ui/card';

function KpiCard({ icon: Icon, label, value, sub }) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-xl font-semibold tabular-nums text-foreground">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SuperadminOverviewPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['superadmin-stats'],
    queryFn: getSuperadminStats,
  });

  if (isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-danger/20 bg-danger-light p-6 text-sm text-danger">
        {error.message}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Platform overview"
        description="Cross-tenant metrics and quick actions"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Building2} label="Active tenants" value={data.activeTenants} sub={`${data.totalTenants} total`} />
        <KpiCard icon={Users} label="Total users" value={data.totalUsers} />
        <KpiCard icon={DollarSign} label="MRR" value={`$${data.mrr}`} sub={`ARR ~ $${data.estimatedArr}`} />
        <KpiCard icon={Mail} label="Mass mail sent" value={data.totalMassMailSent.toLocaleString()} />
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">Quick links</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link href="/superadmin/tenants" className="text-sm font-medium text-brand hover:text-brand-dark">
            Manage tenants →
          </Link>
          <Link href="/superadmin/analytics" className="text-sm font-medium text-brand hover:text-brand-dark">
            View analytics →
          </Link>
          <Link href="/superadmin/settings" className="text-sm font-medium text-brand hover:text-brand-dark">
            System settings →
          </Link>
        </div>
      </div>
    </div>
  );
}
