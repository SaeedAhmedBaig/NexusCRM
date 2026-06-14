'use client';

import { ArrowRight } from 'lucide-react';
import { DashboardMockup } from './ui/dashboard-mockup';
import { Button } from '../ui/button';

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-[#f7f5ef] py-10 sm:py-14 lg:py-16">
      <div className="absolute left-1/2 top-0 h-80 w-[48rem] -translate-x-1/2 rounded-full bg-brand/10 blur-3xl" />
      <div className="marketing-container relative grid items-center gap-10 lg:grid-cols-[0.9fr_1.25fr] lg:gap-12">
        <div className="min-w-0 text-center lg:text-left">
          <p className="marketing-eyebrow mb-4 border-white/70 bg-white/70 sm:mb-6">Customer journey CRM</p>

          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[4.25rem] lg:leading-[0.98]">
            See every customer move before revenue does
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:mt-6 lg:mx-0">
            NexusCRM turns scattered leads, conversations, deals, and renewals into one journey
            dashboard. Spot high-intent accounts, rescue at-risk customers, and guide every team
            from first touch to expansion.
          </p>

          <div className="mx-auto mt-6 grid max-w-xl grid-cols-3 gap-2 text-left lg:mx-0">
            {[
              ['5 stages', 'Journey map'],
              ['82%', 'Health score'],
              ['1,284', 'Active accounts'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white/70 bg-white/65 p-3 shadow-sm">
                <p className="text-lg font-semibold tracking-tight text-foreground">{value}</p>
                <p className="text-[11px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
            <Button href="/signup?plan=free" size="lg" className="w-full gap-2 sm:w-auto">
              Build my journey map
              <ArrowRight className="size-4" />
            </Button>
            <Button href="/contact" variant="outline" size="lg" className="w-full sm:w-auto">
              View demo dashboard
            </Button>
          </div>
        </div>

        <div className="min-w-0 lg:order-none">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}
