'use client';

import { ArrowRight } from 'lucide-react';
import { DashboardMockup } from './ui/dashboard-mockup';
import { Button } from '../ui/button';

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-background py-16 sm:py-20 lg:py-24">
      <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_20%_18%,var(--brand-subtle),transparent_32%),radial-gradient(circle_at_82%_10%,var(--info-light),transparent_28%)]" />
      <div className="marketing-container relative grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="min-w-0 text-center lg:col-span-6 lg:text-left">
          <p className="marketing-eyebrow mb-5 sm:mb-6">
            CRM built around customer movement
          </p>

          <h1 className="text-4xl font-semibold tracking-[-0.06em] text-foreground sm:text-6xl lg:text-[5rem] lg:leading-[0.92]">
            Run every customer journey from one calm workspace
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
            NexusCRM brings leads, accounts, conversations, tasks, campaigns, deals, and renewals
            into a governed CRM system that feels simple for teams and reliable for admins.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
            <Button href="/signup?plan=free" size="lg" className="w-full gap-2 sm:w-auto">
              Start free workspace
              <ArrowRight className="size-4" />
            </Button>
            <Button href="/contact" variant="outline" size="lg" className="w-full sm:w-auto">
              Book a guided demo
            </Button>
          </div>

          <div className="mx-auto mt-8 grid max-w-xl grid-cols-3 gap-3 text-left lg:mx-0">
            {[
              ['3 min', 'workspace setup', 'bg-ink text-ink-foreground'],
              ['24h', 'faster follow-ups', 'bg-success-light text-success'],
              ['1 view', 'customer context', 'bg-info-light text-info'],
            ].map(([value, label, className]) => (
              <div key={label} className={`rounded-[1.5rem] border border-border p-4 shadow-sm ${className}`}>
                <p className="text-xl font-semibold tracking-tight">{value}</p>
                <p className="mt-1 text-[11px] opacity-75">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0 lg:col-span-6 lg:order-none">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}
