'use client';

import {
  MoveUpRight,
  TrendingUp,
  PieChart,
  CircleCheck,
} from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { HeroBarChart } from './hero-bar-chart';

const STATS = [
  { label: 'Total Revenue', value: '$660,500', icon: MoveUpRight },
  { label: 'New Leads', value: '200', icon: TrendingUp },
  { label: 'Pipeline Value', value: '$200,500', icon: PieChart },
  { label: 'Closed Deals', value: '$2,500', icon: CircleCheck },
];

const DONUT_DATA = [
  { name: 'Won', value: 45, fill: 'var(--chart-1)' },
  { name: 'Proposal', value: 30, fill: 'var(--chart-2)' },
  { name: 'Lead', value: 25, fill: 'var(--chart-5)' },
];

export function DashboardMockup() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded bg-foreground text-[10px] font-semibold text-background">
            N
          </span>
          <span className="text-xs font-medium text-foreground">NexusCRM</span>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          {['Dashboard', 'Pipeline', 'Tasks'].map((tab, i) => (
            <span
              key={tab}
              className={`rounded px-2.5 py-1 text-[10px] font-medium ${
                i === 0
                  ? 'bg-background text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              {tab}
            </span>
          ))}
        </div>
        <span className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
          EH
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-foreground">Revenue dashboard</p>
            <p className="text-sm text-muted-foreground">Workspace overview</p>
          </div>
          <span className="rounded-md border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground">
            Jun 6, 2026
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-md border border-border bg-background p-3"
              >
                <Icon className="mb-2 size-4 text-muted-foreground" strokeWidth={1.75} />
                <p className="text-sm font-semibold text-foreground">{stat.value}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{stat.label}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_140px]">
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Conversion rates
            </p>
            <HeroBarChart />
          </div>
          <div className="hidden sm:block">
            <p className="mb-2 text-center text-[10px] font-medium text-muted-foreground">
              Deal stages
            </p>
            <div className="h-[200px] min-h-[200px] w-full">
              <ResponsiveContainer width="100%" height={200}>
                <RePieChart>
                  <Pie
                    data={DONUT_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {DONUT_DATA.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
