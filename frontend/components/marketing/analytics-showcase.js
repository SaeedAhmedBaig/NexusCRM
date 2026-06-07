import { TrendingUp, Users, Target } from 'lucide-react';

const capabilities = [
  {
    icon: TrendingUp,
    label: 'Revenue trend',
    value: '7-day won deal chart',
    sub: 'Aggregated from your closed deals',
  },
  {
    icon: Target,
    label: 'Sales funnel',
    value: 'Stage-by-stage conversion',
    sub: 'Lead → qualified → won pipeline',
  },
  {
    icon: Users,
    label: 'Team performance',
    value: 'Rep revenue & win rate',
    sub: 'Per-assignee metrics from live data',
  },
];

export function AnalyticsShowcase() {
  return (
    <section className="border-t border-border bg-surface px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-meta font-semibold uppercase tracking-wider text-brand">Analytics</p>
            <h2 className="mt-3 text-display text-foreground sm:text-4xl">
              Dashboards fed by your database — not demo data
            </h2>
            <p className="mt-4 text-body-lg text-muted">
              Executive KPIs, funnel charts, and team leaderboards update from your tenant&apos;s
              deals, contacts, and activities. No spreadsheet exports required.
            </p>
            <ul className="mt-8 space-y-4">
              {capabilities.map((m) => {
                const Icon = m.icon;
                return (
                  <li key={m.label} className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-light">
                      <Icon className="h-5 w-5 text-foreground" strokeWidth={2} />
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{m.label}</p>
                      <p className="text-lg font-semibold tracking-tight text-foreground">{m.value}</p>
                      <p className="text-meta">{m.sub}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
            <p className="text-sm font-medium text-foreground">Sample funnel view</p>
            <p className="text-meta">Illustrative layout — values come from your workspace</p>
            <div className="mt-6 space-y-3">
              {[
                { stage: 'Lead', width: '100%' },
                { stage: 'Qualified', width: '72%' },
                { stage: 'Proposal', width: '48%' },
                { stage: 'Won', width: '28%' },
              ].map((row) => (
                <div key={row.stage}>
                  <div className="mb-1 flex justify-between text-xs text-muted">
                    <span>{row.stage}</span>
                  </div>
                  <div className="h-8 overflow-hidden rounded-lg bg-surface">
                    <div className="h-full rounded-lg bg-brand/50" style={{ width: row.width }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
