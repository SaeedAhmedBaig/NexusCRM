'use client';

import { Suspense, useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { listDepartments } from '../../../lib/api';
import {
  getIncomeSummary,
  getSalesFunnel,
  getLeadSourcePerformance,
  getConversionSummary,
  exportAnalytics,
} from '../../../lib/analytics-api';
import { Spinner } from '../../../components/ui/spinner';
import { PageHeader } from '../../../components/ui/page-header';
import { Card, CardContent } from '../../../components/ui/card';
import { useChartColors } from '../../../lib/chart-theme';
import { BarChartPanel } from '../../../components/charts/bar-chart-panel';
import { LineChartPanel } from '../../../components/charts/line-chart-panel';
import { FunnelBarChart } from '../../../components/charts/funnel-bar-chart';
import { useSession } from '../../../components/providers/session-context';
import { Can } from '../../../components/can';

const TABS = [
  { id: 'income', label: 'Income Summary' },
  { id: 'funnel', label: 'Sales Funnel' },
  { id: 'sources', label: 'Lead Sources' },
  { id: 'conversion', label: 'Conversion' },
];

function monthStart() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

const VALID_TABS = new Set(TABS.map((t) => t.id));

function AnalyticsPageInner() {
  const { profile } = useSession();
  const colors = useChartColors();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab');
  const [tab, setTab] = useState(VALID_TABS.has(initialTab) ? initialTab : 'income');

  useEffect(() => {
    if (VALID_TABS.has(initialTab)) setTab(initialTab);
  }, [initialTab]);
  const [start, setStart] = useState(monthStart());
  const [end, setEnd] = useState(today());
  const [department, setDepartment] = useState('');

  const params = useMemo(() => ({ start, end, department }), [start, end, department]);

  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: listDepartments });

  const { data: income, isLoading: incomeLoading } = useQuery({
    queryKey: ['analytics-income', params],
    queryFn: () => getIncomeSummary(params),
    enabled: tab === 'income',
  });

  const { data: funnel, isLoading: funnelLoading } = useQuery({
    queryKey: ['analytics-funnel', params],
    queryFn: () => getSalesFunnel(params),
    enabled: tab === 'funnel',
  });

  const { data: sources, isLoading: sourcesLoading } = useQuery({
    queryKey: ['analytics-sources', params],
    queryFn: () => getLeadSourcePerformance(params),
    enabled: tab === 'sources',
  });

  const { data: conversion, isLoading: conversionLoading } = useQuery({
    queryKey: ['analytics-conversion', params],
    queryFn: () => getConversionSummary(params),
    enabled: tab === 'conversion',
  });

  const loading = incomeLoading || funnelLoading || sourcesLoading || conversionLoading;

  const funnelStages = useMemo(() => {
    if (!funnel?.stages) return [];
    return funnel.stages.map((s) => ({
      key: (s.stage || s.key || '').toLowerCase(),
      label: s.label || s.stage,
      count: s.count || 0,
    }));
  }, [funnel]);

  return (
    <Can action="read" subject="Analytics" rules={profile?.rules} fallback={
      <p className="rounded-lg border border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
        You do not have permission to view analytics. Contact your workspace admin.
      </p>
    }>
    <div className="space-y-8">
      <PageHeader
        title="Analytics"
        description="Revenue, funnel, lead sources, and conversion insights"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="input-base w-auto" />
            <span className="text-meta">to</span>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="input-base w-auto" />
            <select value={department} onChange={(e) => setDepartment(e.target.value)} className="input-base w-auto">
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d._id || d.id} value={d._id || d.id}>{d.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => exportAnalytics(params)}
              className="focus-ring inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-surface"
            >
              <Download className="h-4 w-4" strokeWidth={2} /> Export
            </button>
          </div>
        }
      />

      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`focus-ring whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              tab === t.id ? 'border-brand text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>
      ) : (
        <Card>
          <CardContent className="p-6">
            {tab === 'income' && income && (
              <div className="space-y-6">
                <BarChartPanel
                  labels={income.months.map((m) => m.month)}
                  datasets={[
                    { label: 'Actual', data: income.months.map((m) => m.actual), backgroundColor: colors.brand },
                    { label: 'Forecast', data: income.months.map((m) => m.forecast), backgroundColor: colors.palette[3] },
                  ]}
                />
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="pb-2">Month</th>
                      <th className="pb-2">Actual</th>
                      <th className="pb-2">Forecast</th>
                    </tr>
                  </thead>
                  <tbody>
                    {income.months.map((m) => (
                      <tr key={m.month} className="border-b border-border">
                        <td className="py-2">{m.month}</td>
                        <td className="py-2">${m.actual.toLocaleString()}</td>
                        <td className="py-2">${m.forecast.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'funnel' && funnel && (
              <div className="min-h-[360px]">
                <FunnelBarChart stages={funnelStages} />
              </div>
            )}

            {tab === 'sources' && sources && (
              <BarChartPanel
                horizontal
                labels={sources.sources.map((s) => s.source)}
                datasets={[
                  { label: 'Leads', data: sources.sources.map((s) => s.requests), backgroundColor: colors.brand },
                  { label: 'Converted', data: sources.sources.map((s) => s.converted), backgroundColor: colors.palette[4] },
                ]}
              />
            )}

            {tab === 'conversion' && conversion && (
              <LineChartPanel
                labels={conversion.days.map((d) => d.date)}
                datasets={[
                  { label: 'Conversion %', data: conversion.days.map((d) => d.rate), borderColor: colors.brand },
                  { label: 'Requests', data: conversion.days.map((d) => d.requests), borderColor: colors.palette[3] },
                  { label: 'Deals won', data: conversion.days.map((d) => d.deals), borderColor: colors.palette[4] },
                ]}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
    </Can>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>}>
      <AnalyticsPageInner />
    </Suspense>
  );
}
