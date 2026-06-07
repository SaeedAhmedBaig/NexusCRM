'use client';

import { useQuery } from '@tanstack/react-query';
import { Building2, DollarSign, Users } from 'lucide-react';
import { getSuperadminStats } from '../../../lib/superadmin-api';
import { LineChartPanel } from '../../../components/charts/line-chart-panel';
import { PageHeader } from '../../../components/ui/page-header';
import { Card, CardContent } from '../../../components/ui/card';
import { Spinner } from '../../../components/ui/spinner';

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

export default function SuperadminAnalyticsPage() {
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

  const mrrLabels = data.mrrHistory?.map((m) => m.month) || [];
  const mrrValues = data.mrrHistory?.map((m) => m.mrr) || [];
  const tenantValues = data.mrrHistory?.map((m) => m.tenants) || [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Global analytics"
        description="Platform-wide revenue and tenant growth"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={DollarSign} label="MRR" value={`$${data.mrr}`} sub={`ARR ~ $${data.estimatedArr}`} />
        <KpiCard icon={Building2} label="Active tenants" value={data.activeTenants} sub={`${data.suspendedTenants} suspended`} />
        <KpiCard icon={Users} label="Total users" value={data.totalUsers} />
        <KpiCard icon={Building2} label="Total tenants" value={data.totalTenants} />
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">MRR trend (6 months)</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Estimated from plan pricing and active tenants</p>
        <div className="mt-4">
          <LineChartPanel
            labels={mrrLabels}
            datasets={[
              { label: 'MRR ($)', data: mrrValues },
              { label: 'Tenants', data: tenantValues, borderDash: [4, 4] },
            ]}
            height={280}
          />
        </div>
      </div>

      {data.planBreakdown && Object.keys(data.planBreakdown).length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">Plan distribution</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(data.planBreakdown).map(([plan, count]) => (
              <div key={plan} className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                <p className="text-xs text-muted-foreground">{plan}</p>
                <p className="text-lg font-semibold tabular-nums">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
