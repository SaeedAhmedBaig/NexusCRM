'use client';

import {
  Activity,
  ArrowUpRight,
  CircleCheck,
  Clock3,
  MessageCircle,
  MousePointerClick,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';

const JOURNEY_STAGES = [
  { name: 'Aware', value: 842, change: '+12%', tone: 'bg-[#fff1e8] text-[#c9481f]', width: '92%' },
  { name: 'Engaged', value: 518, change: '+8%', tone: 'bg-[#eef6ff] text-[#2563eb]', width: '72%' },
  { name: 'Qualified', value: 236, change: '+16%', tone: 'bg-[#f1f8ee] text-[#15803d]', width: '55%' },
  { name: 'Proposal', value: 94, change: '+5%', tone: 'bg-[#f5f0ff] text-[#7c3aed]', width: '36%' },
  { name: 'Retained', value: 61, change: '+21%', tone: 'bg-[#fff8db] text-[#a16207]', width: '28%' },
];

const SEGMENTS = [
  { label: 'High intent accounts', value: '128', detail: 'Visited pricing twice', accent: 'bg-brand' },
  { label: 'At-risk customers', value: '34', detail: 'No touch in 21 days', accent: 'bg-warning' },
  { label: 'Expansion ready', value: '57', detail: 'Usage above plan limit', accent: 'bg-success' },
];

const EVENTS = [
  { icon: MousePointerClick, title: 'Acme viewed enterprise plan', time: '2m ago' },
  { icon: MessageCircle, title: 'Northline replied to proposal', time: '14m ago' },
  { icon: CircleCheck, title: 'Apex completed onboarding', time: '1h ago' },
];

export function DashboardMockup() {
  return (
    <div className="relative mx-auto max-w-[680px] overflow-hidden rounded-[2rem] border border-border bg-[#f7f5ef] p-3 shadow-[0_24px_80px_rgba(24,24,27,0.14)]">
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand/20 blur-3xl" />
      <div className="absolute -bottom-20 left-20 h-56 w-56 rounded-full bg-blue-400/10 blur-3xl" />

      <div className="relative grid overflow-hidden rounded-[1.5rem] border border-white/70 bg-white/85 shadow-sm backdrop-blur xl:grid-cols-[72px_1fr]">
        <aside className="hidden border-r border-border bg-[#111113] p-3 text-white xl:block">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-brand text-sm font-bold">N</div>
          <nav className="mt-8 space-y-3">
            {[Activity, Users, TrendingUp, Clock3].map((Icon, index) => (
              <span
                key={index}
                className={`flex size-10 items-center justify-center rounded-2xl ${
                  index === 0 ? 'bg-white text-foreground' : 'text-white/55'
                }`}
              >
                <Icon className="size-4" strokeWidth={1.8} />
              </span>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">Customer Journey</p>
                <span className="rounded-full bg-success-light px-2 py-0.5 text-[10px] font-semibold text-success">
                  Live
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Track every account from first touch to expansion.</p>
            </div>
            <button className="hidden rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm sm:inline-flex">
              This month
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Journey score', value: '82%', icon: Sparkles },
              { label: 'Active accounts', value: '1,284', icon: Users },
              { label: 'Conversion lift', value: '+18.4%', icon: ArrowUpRight },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.label} className="rounded-2xl border border-border bg-white p-3 shadow-sm">
                  <div className="mb-3 flex size-8 items-center justify-center rounded-xl bg-muted">
                    <Icon className="size-4 text-foreground" strokeWidth={1.8} />
                  </div>
                  <p className="text-xl font-semibold tracking-tight text-foreground">{item.value}</p>
                  <p className="text-[11px] text-muted-foreground">{item.label}</p>
                </article>
              );
            })}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.45fr_0.8fr]">
            <section className="rounded-3xl border border-border bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Journey funnel</p>
                  <p className="text-[11px] text-muted-foreground">Stage velocity by account</p>
                </div>
                <span className="rounded-full bg-brand-light px-2 py-1 text-[10px] font-semibold text-brand">
                  +13% MoM
                </span>
              </div>
              <div className="space-y-3">
                {JOURNEY_STAGES.map((stage) => (
                  <div key={stage.name} className="grid grid-cols-[72px_1fr_52px] items-center gap-3">
                    <span className="text-[11px] font-medium text-muted-foreground">{stage.name}</span>
                    <div className="h-9 overflow-hidden rounded-full bg-muted">
                      <div className={`flex h-full items-center justify-end rounded-full pr-3 ${stage.tone}`} style={{ width: stage.width }}>
                        <span className="text-[11px] font-semibold">{stage.value}</span>
                      </div>
                    </div>
                    <span className="text-right text-[11px] font-semibold text-success">{stage.change}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-[#111113] p-4 text-white shadow-sm">
              <p className="text-sm font-semibold">Journey health</p>
              <p className="mt-1 text-[11px] text-white/55">Accounts needing attention</p>
              <div className="mt-5 flex items-end gap-1.5">
                {[42, 76, 54, 88, 62, 94, 72].map((height, index) => (
                  <span
                    key={index}
                    className={`flex-1 rounded-t-xl ${index === 5 ? 'bg-brand' : 'bg-white/18'}`}
                    style={{ height }}
                  />
                ))}
              </div>
              <div className="mt-5 rounded-2xl bg-white/10 p-3">
                <p className="text-2xl font-semibold">34</p>
                <p className="text-[11px] text-white/60">At-risk accounts</p>
              </div>
            </section>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1fr]">
            <section className="rounded-3xl border border-border bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-foreground">Smart segments</p>
              <div className="mt-4 space-y-3">
                {SEGMENTS.map((segment) => (
                  <div key={segment.label} className="flex items-center justify-between gap-3 rounded-2xl bg-muted/70 p-3">
                    <div className="flex items-center gap-3">
                      <span className={`size-2.5 rounded-full ${segment.accent}`} />
                      <div>
                        <p className="text-xs font-semibold text-foreground">{segment.label}</p>
                        <p className="text-[11px] text-muted-foreground">{segment.detail}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{segment.value}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-foreground">Recent journey events</p>
              <div className="mt-4 space-y-3">
                {EVENTS.map((event) => {
                  const Icon = event.icon;
                  return (
                    <div key={event.title} className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-2xl bg-brand-light text-brand">
                        <Icon className="size-4" strokeWidth={1.8} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-foreground">{event.title}</p>
                        <p className="text-[11px] text-muted-foreground">{event.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
