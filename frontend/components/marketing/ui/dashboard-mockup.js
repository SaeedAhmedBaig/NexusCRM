'use client';

import { Fragment } from 'react';
import { ArrowRight, CircleCheck, MessageCircle, MousePointerClick, Sparkles } from 'lucide-react';

const STAGES = [
  { label: 'First touch', color: 'bg-brand', soft: 'bg-brand-light' },
  { label: 'Engaged', color: 'bg-info', soft: 'bg-info-light' },
  { label: 'Qualified', color: 'bg-success', soft: 'bg-success-light' },
  { label: 'Expansion', color: 'bg-warning', soft: 'bg-warning-light' },
];

const SIGNALS = [
  { icon: MousePointerClick, label: 'Pricing viewed', color: 'text-brand', bg: 'bg-brand-light' },
  { icon: MessageCircle, label: 'Reply received', color: 'text-info', bg: 'bg-info-light' },
  { icon: CircleCheck, label: 'Task completed', color: 'text-success', bg: 'bg-success-light' },
];

export function DashboardMockup() {
  return (
    <div className="relative mx-auto max-w-[620px] rounded-[2.75rem] border border-border bg-card p-4 shadow-lg">
      <div className="absolute -right-10 -top-10 size-40 rounded-full bg-brand-subtle blur-3xl" />
      <div className="absolute -bottom-12 left-8 size-44 rounded-full bg-info-light blur-3xl" />

      <div className="relative rounded-[2.25rem] border border-border bg-surface p-5 text-foreground">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Journey architecture</p>
            <p className="mt-1 text-xs text-muted-foreground">Signals, owners, and next steps in one path.</p>
          </div>
          <span className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-ink-foreground">Live flow</span>
        </div>

        <div className="mt-8 grid gap-5">
          <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:gap-2">
            {STAGES.slice(0, 3).map((stage, index) => (
              <Fragment key={stage.label}>
                <div className={`rounded-[1.5rem] border border-border bg-card p-4 shadow-sm ${stage.soft}`}>
                  <span className={`mb-4 block size-3 rounded-full ${stage.color}`} />
                  <p className="text-sm font-semibold">{stage.label}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Signal captured</p>
                </div>
                {index < 2 && (
                  <div className="hidden items-center justify-center text-muted-foreground sm:flex">
                    <ArrowRight className="size-4" />
                  </div>
                )}
              </Fragment>
            ))}
          </div>

          <div className="grid gap-3 rounded-[1.75rem] border border-border bg-card p-4 shadow-sm sm:grid-cols-3">
            {SIGNALS.map((signal) => {
              const Icon = signal.icon;
              return (
                <div key={signal.label} className="flex items-center gap-3">
                  <span className={`flex size-9 items-center justify-center rounded-full ${signal.bg}`}>
                    <Icon className={`size-4 ${signal.color}`} />
                  </span>
                  <p className="text-xs font-semibold">{signal.label}</p>
                </div>
              );
            })}
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_0.78fr]">
            <div className="rounded-[1.75rem] bg-ink p-4 text-ink-foreground">
              <Sparkles className="size-4 text-brand" />
              <p className="mt-4 text-lg font-semibold">Next best action</p>
              <p className="mt-1 text-xs leading-relaxed opacity-70">
                Prioritize accounts by intent, health, and ownership without showing another dashboard screenshot.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-border bg-card p-4 shadow-sm">
              <p className="text-xs font-semibold text-muted-foreground">Semantic status</p>
              <div className="mt-4 space-y-2">
                {STAGES.map((stage) => (
                  <div key={stage.label} className="flex items-center gap-2">
                    <span className={`size-2.5 rounded-full ${stage.color}`} />
                    <span className="text-xs font-medium">{stage.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
