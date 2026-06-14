'use client';

import { ArrowRight } from 'lucide-react';
import { DashboardMockup } from './ui/dashboard-mockup';
import { Button } from '../ui/button';

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-[radial-gradient(circle_at_18%_8%,rgba(239,91,79,0.12),transparent_28%),linear-gradient(135deg,#f8fafc_0%,#eef2f7_48%,#e6ebf3_100%)] py-12 sm:py-16 lg:py-20">
      <div className="absolute inset-x-6 top-6 h-28 rounded-[3rem] bg-white/45 blur-2xl" />
      <div className="marketing-container relative grid items-center gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:gap-14">
        <div className="min-w-0 text-center lg:text-left">
          <p className="marketing-eyebrow mb-5 border-white/80 bg-white/80 text-[#424957] shadow-sm sm:mb-6">
            Customer journey CRM
          </p>

          <h1 className="text-4xl font-semibold tracking-[-0.055em] text-[#101114] sm:text-6xl lg:text-[4.75rem] lg:leading-[0.94]">
            See every customer move before revenue does
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[#505968] sm:text-lg lg:mx-0">
            NexusCRM turns scattered leads, conversations, deals, and renewals into one journey
            dashboard. Spot high-intent accounts, rescue at-risk customers, and guide every team
            from first touch to expansion.
          </p>

          <div className="mx-auto mt-7 grid max-w-xl grid-cols-3 gap-3 text-left lg:mx-0">
            {[
              ['5', 'Journey stages', 'bg-[#101114] text-white'],
              ['82%', 'Health score', 'bg-[#eaf7ef] text-[#137a3d]'],
              ['1,284', 'Active accounts', 'bg-[#eef5ff] text-[#245fbd]'],
            ].map(([value, label, className]) => (
              <div key={label} className={`rounded-[1.35rem] border border-white/85 p-4 shadow-sm ${className}`}>
                <p className="text-xl font-semibold tracking-tight">{value}</p>
                <p className="mt-1 text-[11px] opacity-75">{label}</p>
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
