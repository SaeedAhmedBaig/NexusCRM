'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download } from 'lucide-react';
import { useSession } from '../providers/session-context';
import { listDepartments } from '../../lib/api';
import {
  getIncomeSummary,
  getSalesFunnel,
  getLeadSourcePerformance,
  getConversionSummary,
  getTeamPerformance,
  exportAnalytics,
} from '../../lib/analytics-api';
import { getTenantUrl } from '../../lib/tenant';
import { PageHeader } from '../ui/page-header';
import { Card, CardContent } from '../ui/card';
import { Spinner } from '../ui/spinner';
import { BarChartPanel } from '../charts/bar-chart-panel';
import { LineChartPanel } from '../charts/line-chart-panel';
import { FunnelBarChart } from '../charts/funnel-bar-chart';
import { useChartColors } from '../../lib/chart-theme';

function monthStart() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function DateFilters({ start, end, department, departments, onStart, onEnd, onDepartment, onExport, params }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input type="date" value={start} onChange={(e) => onStart(e.target.value)} className="input-base w-auto min-w-0" />
      <span className="text-meta">to</span>
      <input type="date" value={end} onChange={(e) => onEnd(e.target.value)} className="input-base w-auto min-w-0" />
      <select value={department} onChange={(e) => onDepartment(e.target.value)} className="input-base w-auto min-w-0 max-w-[180px]">
        <option value="">All departments</option>
        {departments.map((d) => (
          <option key={d._id || d.id} value={d._id || d.id}>{d.name}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => exportAnalytics(params)}
        className="focus-ring inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted"
      >
        <Download className="h-4 w-4" strokeWidth={2} /> Export
      </button>
    </div>
  );
}

function Kpi({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

export function SalesReportPage() {
  const colors = useChartColors();
  const [start, setStart] = useState(monthStart());
  const [end, setEnd] = useState(today());
  const [department, setDepartment] = useState('');
  const params = useMemo(() => ({ start, end, department }), [start, end, department]);

  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: listDepartments });
  const { data, isLoading } = useQuery({
    queryKey: ['report-sales', params],
    queryFn: () => getIncomeSummary(params),
  });

  return (
    <ReportShell
      title="Sales reports"
      description="Revenue performance, won deals, and forecast by month"
      filters={
        <DateFilters
          start={start} end={end} department={department} departments={departments}
          onStart={setStart} onEnd={setEnd} onDepartment={setDepartment}
          onExport={exportAnalytics} params={params}
        />
      }
      loading={isLoading}
    >
      {data && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <Kpi label="Total revenue (period)" value={`$${(data.totalActual || 0).toLocaleString()}`} />
            <Kpi label="Pipeline forecast" value={`$${(data.totalForecast || 0).toLocaleString()}`} />
          </div>
          <BarChartPanel
            labels={data.months.map((m) => m.month)}
            datasets={[
              { label: 'Actual revenue', data: data.months.map((m) => m.actual), backgroundColor: colors.brand },
              { label: 'Forecast', data: data.months.map((m) => m.forecast), backgroundColor: colors.palette[3] },
            ]}
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[320px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Month</th>
                  <th className="pb-2 font-medium">Actual</th>
                  <th className="pb-2 font-medium">Forecast</th>
                </tr>
              </thead>
              <tbody>
                {data.months.map((m) => (
                  <tr key={m.month} className="border-b border-border/60">
                    <td className="py-2.5 text-foreground">{m.month}</td>
                    <td className="py-2.5 tabular-nums">${m.actual.toLocaleString()}</td>
                    <td className="py-2.5 tabular-nums text-muted-foreground">${m.forecast.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </ReportShell>
  );
}

export function CustomerReportPage() {
  const colors = useChartColors();
  const [start, setStart] = useState(monthStart());
  const [end, setEnd] = useState(today());
  const [department, setDepartment] = useState('');
  const params = useMemo(() => ({ start, end, department }), [start, end, department]);

  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: listDepartments });
  const { data: sources, isLoading: s1 } = useQuery({
    queryKey: ['report-customer-sources', params],
    queryFn: () => getLeadSourcePerformance(params),
  });
  const { data: conversion, isLoading: s2 } = useQuery({
    queryKey: ['report-customer-conversion', params],
    queryFn: () => getConversionSummary(params),
  });

  const totals = useMemo(() => {
    if (!sources?.sources) return { leads: 0, converted: 0, rate: 0 };
    const leads = sources.sources.reduce((s, r) => s + r.requests, 0);
    const converted = sources.sources.reduce((s, r) => s + r.converted, 0);
    return { leads, converted, rate: leads ? Math.round((converted / leads) * 100) : 0 };
  }, [sources]);

  return (
    <ReportShell
      title="Customer reports"
      description="Lead sources, conversion rates, and customer acquisition trends"
      filters={
        <DateFilters
          start={start} end={end} department={department} departments={departments}
          onStart={setStart} onEnd={setEnd} onDepartment={setDepartment}
          onExport={exportAnalytics} params={params}
        />
      }
      loading={s1 || s2}
    >
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <Kpi label="Total leads" value={totals.leads.toLocaleString()} />
          <Kpi label="Converted" value={totals.converted.toLocaleString()} />
          <Kpi label="Conversion rate" value={`${totals.rate}%`} />
        </div>
        {sources && (
          <BarChartPanel
            horizontal
            labels={sources.sources.map((s) => s.source)}
            datasets={[
              { label: 'Leads', data: sources.sources.map((s) => s.requests), backgroundColor: colors.brand },
              { label: 'Converted', data: sources.sources.map((s) => s.converted), backgroundColor: colors.palette[4] },
            ]}
          />
        )}
        {conversion && (
          <LineChartPanel
            labels={conversion.days.map((d) => d.date)}
            datasets={[
              { label: 'Conversion %', data: conversion.days.map((d) => d.rate), borderColor: colors.brand },
              { label: 'Requests', data: conversion.days.map((d) => d.requests), borderColor: colors.palette[3] },
            ]}
            height={260}
          />
        )}
      </div>
    </ReportShell>
  );
}

export function TeamReportPage() {
  const colors = useChartColors();
  const [start, setStart] = useState(monthStart());
  const [end, setEnd] = useState(today());
  const [department, setDepartment] = useState('');
  const params = useMemo(() => ({ start, end, department }), [start, end, department]);

  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: listDepartments });
  const { data, isLoading } = useQuery({
    queryKey: ['report-team', params],
    queryFn: () => getTeamPerformance(params),
  });

  return (
    <ReportShell
      title="Team performance"
      description="Deals won, tasks completed, and productivity by team member"
      filters={
        <DateFilters
          start={start} end={end} department={department} departments={departments}
          onStart={setStart} onEnd={setEnd} onDepartment={setDepartment}
          onExport={exportAnalytics} params={params}
        />
      }
      loading={isLoading}
    >
      {data && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <Kpi label="Active team members" value={data.members.length} />
            <Kpi label="Total deals won" value={data.members.reduce((s, m) => s + m.dealsWon, 0)} />
          </div>
          <BarChartPanel
            horizontal
            labels={data.members.map((m) => m.name)}
            datasets={[
              { label: 'Deals won', data: data.members.map((m) => m.dealsWon), backgroundColor: colors.brand },
              { label: 'Tasks done', data: data.members.map((m) => m.tasksDone), backgroundColor: colors.palette[3] },
            ]}
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Member</th>
                  <th className="pb-2 font-medium">Deals won</th>
                  <th className="pb-2 font-medium">Revenue</th>
                  <th className="pb-2 font-medium">Tasks done</th>
                </tr>
              </thead>
              <tbody>
                {data.members.map((m) => (
                  <tr key={m.id} className="border-b border-border/60">
                    <td className="py-2.5 font-medium text-foreground">{m.name}</td>
                    <td className="py-2.5 tabular-nums">{m.dealsWon}</td>
                    <td className="py-2.5 tabular-nums">${m.revenue.toLocaleString()}</td>
                    <td className="py-2.5 tabular-nums">{m.tasksDone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </ReportShell>
  );
}

function ReportShell({ title, description, filters, loading, children }) {
  const { subdomain } = useSession();

  return (
    <div className="space-y-6">
      <Link
        href={getTenantUrl(subdomain, '/reports')}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to reporting center
      </Link>
      <PageHeader title={title} description={description} actions={filters} />
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>
      ) : (
        <Card>
          <CardContent className="p-4 sm:p-6">{children}</CardContent>
        </Card>
      )}
    </div>
  );
}
