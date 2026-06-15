'use client';

import {
  DollarSign,
  TrendingUp,
  Briefcase,
  Trophy,
  Percent,
  Users,
  Ticket,
  Repeat,
} from 'lucide-react';
import { KpiCard } from './kpi-card';
import { TeamPerformanceChart } from './team-performance-chart';
import { PipelineGauge } from './pipeline-gauge';
import { SalesChart } from './sales-chart';
import { SalesFunnel } from './sales-funnel';
import { ActivityFeed } from './activity-feed';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';

function formatCurrency(value) {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export function ExecutiveDashboard({ widgets, salesTrend, funnelStages, activity = [], subdomain }) {
  const kpis = [
    { key: 'totalRevenue', label: 'Total revenue', value: formatCurrency(widgets?.totalRevenue), icon: DollarSign, trend: widgets?.revenueTrend },
    { key: 'monthlyRevenue', label: 'Monthly revenue', value: formatCurrency(widgets?.monthlyRevenue), icon: TrendingUp, trend: widgets?.monthlyTrend },
    { key: 'openDeals', label: 'Open deals', value: widgets?.openDeals ?? '—', icon: Briefcase },
    { key: 'closedDeals', label: 'Closed deals', value: widgets?.closedDeals ?? '—', icon: Trophy },
    { key: 'conversionRate', label: 'Conversion rate', value: widgets?.conversionRate != null ? `${widgets.conversionRate}%` : '—', icon: Percent },
    { key: 'activeCustomers', label: 'Active customers', value: widgets?.activeCustomers ?? '—', icon: Users },
    { key: 'supportTickets', label: 'Support tickets', value: widgets?.supportTickets ?? '—', icon: Ticket },
    { key: 'mrr', label: 'MRR', value: formatCurrency(widgets?.mrr), icon: Repeat, trend: widgets?.mrrTrend },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard
            key={k.key}
            label={k.label}
            value={k.value}
            icon={k.icon}
            trend={k.trend}
            trendLabel={k.trend != null ? 'vs prior month' : undefined}
          />
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ActivityFeed subdomain={subdomain} items={activity} compact />
        </div>
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Journey snapshot</CardTitle>
            <CardDescription>Accounts moving through your workflow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {[
              { label: 'Open pipeline', value: widgets?.openDeals ?? '—' },
              { label: 'Pending requests', value: widgets?.pendingRequests ?? '—' },
              { label: 'Tasks due today', value: widgets?.tasksDueToday ?? widgets?.myTasks ?? '—' },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-2xl bg-muted px-3 py-2">
                <span className="text-[13px] text-muted-foreground">{row.label}</span>
                <span className="text-sm font-semibold tabular-nums text-foreground">{row.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <SalesChart data={salesTrend} compact />
        <SalesFunnel stages={funnelStages} title="Sales funnel" subtitle="Lead → Won conversion" compact />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <TeamPerformanceChart data={widgets?.teamPerformance || []} compact />
        <PipelineGauge value={widgets?.pipelineValue} max={widgets?.pipelineTarget} compact />
      </div>
    </div>
  );
}
