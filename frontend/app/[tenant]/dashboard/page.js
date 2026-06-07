'use client';

import { useCallback, useEffect, useState } from 'react';
import { getDashboardWidgets, getRecentActivity, getSalesTrend } from '../../../lib/api';
import { getSalesFunnel } from '../../../lib/analytics-api';
import { ROLE_LABELS } from '../../../lib/roles';
import { ROLES } from '../../../lib/roles';
import { useSession } from '../../../components/providers/session-context';
import { WidgetGrid } from '../../../components/dashboard/widget-grid';
import { ExecutiveDashboard } from '../../../components/dashboard/executive-dashboard';
import { ActivityFeed } from '../../../components/dashboard/activity-feed';
import { QuickActions } from '../../../components/dashboard/quick-actions';
import { PageHeader } from '../../../components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { SkeletonCard } from '../../../components/ui/skeleton';

const EXEC_ROLES = [ROLES.OWNER, ROLES.ADMIN, ROLES.CHIEF];

export default function TenantDashboardPage() {
  const { profile, subdomain } = useSession();
  const [widgets, setWidgets] = useState(null);
  const [activity, setActivity] = useState([]);
  const [salesTrend, setSalesTrend] = useState([]);
  const [funnelStages, setFunnelStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    const end = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
    const [widgetData, activityData, trendData, funnelData] = await Promise.all([
      getDashboardWidgets(),
      getRecentActivity(10),
      getSalesTrend(),
      getSalesFunnel({ start, end }).catch(() => null),
    ]);
    setWidgets(widgetData);
    setActivity(activityData);
    setSalesTrend(trendData?.days || []);
    if (funnelData?.stages) {
      setFunnelStages(
        funnelData.stages.map((s) => ({
          key: s.stage || s.key,
          label: s.label || s.stage,
          count: s.count || 0,
          revenue: s.revenue || s.value || 0,
        })),
      );
    }
  }, []);

  useEffect(() => {
    loadDashboard()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-2">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-4 w-64" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger-light p-6 text-center text-sm text-danger">
        {error}
      </div>
    );
  }

  const roleLabel = ROLE_LABELS[profile?.user?.role] || profile?.user?.role;
  const greeting = getGreeting();
  const name = profile?.user?.name || profile?.user?.email?.split('@')[0];
  const isExecutive = widgets?.executiveView || EXEC_ROLES.includes(profile?.user?.role);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Good ${greeting}, ${name}`}
        description={`${roleLabel} · Business health at a glance`}
        actions={<QuickActions subdomain={subdomain} onSuccess={loadDashboard} />}
      />

      {isExecutive ? (
        <ExecutiveDashboard
          widgets={widgets}
          salesTrend={salesTrend}
          funnelStages={funnelStages}
          activity={activity}
          subdomain={subdomain}
        />
      ) : (
        <>
          <WidgetGrid widgets={widgets} />
          <div className="grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <ActivityFeed subdomain={subdomain} items={activity} compact />
            </div>
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Pipeline snapshot</CardTitle>
                <CardDescription>Key opportunities at a glance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {[
                  { label: 'Open pipeline', value: widgets?.openDeals ?? '—' },
                  { label: 'Pending requests', value: widgets?.pendingRequests ?? '—' },
                  { label: 'Tasks due today', value: widgets?.tasksDueToday ?? widgets?.myTasks ?? '—' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between rounded-lg bg-brand-subtle px-3 py-2">
                    <span className="text-sm text-muted">{row.label}</span>
                    <span className="text-base font-semibold tabular-nums text-foreground">{row.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
