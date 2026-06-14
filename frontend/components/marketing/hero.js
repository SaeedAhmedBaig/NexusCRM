'use client';

import { ArrowRight } from 'lucide-react';
import { DashboardMockup } from './ui/dashboard-mockup';
import { Button } from '../ui/button';

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-[radial-gradient(circle_at_12%_12%,rgba(239,91,79,0.14),transparent_28%),radial-gradient(circle_at_88%_16%,rgba(53,119,220,0.12),transparent_26%),linear-gradient(135deg,#f8fafc_0%,#eef2f7_52%,#e7ecf4_100%)] py-14 sm:py-20 lg:py-24">
      <div className="absolute inset-x-8 top-8 h-32 rounded-[3rem] bg-white/50 blur-2xl" />
      <div className="marketing-container relative grid items-center gap-12 lg:grid-cols-[1fr_0.92fr] lg:gap-16">
        <div className="min-w-0 text-center lg:text-left">
          <p className="marketing-eyebrow mb-5 border-white/80 bg-white/80 text-[#424957] shadow-sm sm:mb-6">
            Customer journey CRM for modern teams
          </p>

          <h1 className="text-4xl font-semibold tracking-[-0.055em] text-[#101114] sm:text-6xl lg:text-[4.9rem] lg:leading-[0.93]">
            Turn customer chaos into one clear growth path
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[#505968] sm:text-lg lg:mx-0">
            NexusCRM connects leads, conversations, tasks, deals, and renewals so every team knows
            what happened, who owns the next step, and which customers need attention now.
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
              ['3 min', 'workspace setup', 'bg-[#101114] text-white'],
              ['24h', 'faster follow-ups', 'bg-[#eaf7ef] text-[#137a3d]'],
              ['1 place', 'for customer context', 'bg-[#eef5ff] text-[#245fbd]'],
            ].map(([value, label, className]) => (
              <div key={label} className={`rounded-[1.35rem] border border-white/85 p-4 shadow-sm ${className}`}>
                <p className="text-xl font-semibold tracking-tight">{value}</p>
                <p className="mt-1 text-[11px] opacity-75">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0 lg:order-none">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}
