'use client';

import { ArrowRight } from 'lucide-react';
import { DashboardMockup } from './ui/dashboard-mockup';
import { Button } from '../ui/button';

const CAPABILITIES = ['CRM', 'Tasks', 'Campaigns', 'Reports', 'Workflows', 'Billing'];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-[#f7faf8] py-16 dark:bg-background sm:py-20 lg:py-24">
      <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_50%_0%,rgba(0,127,137,0.14),transparent_34%)]" />
      <div className="marketing-container relative">
        <div className="mx-auto max-w-4xl text-center">
          <p className="marketing-eyebrow mb-5 sm:mb-6">
            Customer operations by NexusCRM
          </p>

          <h1 className="text-5xl font-bold tracking-[-0.07em] text-foreground sm:text-7xl lg:text-[6.25rem] lg:leading-[0.88]">
            CRM that<br className="hidden sm:block" /> does it all
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-xl">
            Run sales, support, tasks, quotes, invoices, marketing campaigns, automation, and customer
            reporting from one fast workspace with readable light and dark mode.
          </p>

          <div className="mx-auto mt-7 flex max-w-3xl flex-wrap justify-center gap-2">
            {CAPABILITIES.map((item) => (
              <span key={item} className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground shadow-sm">
                {item}
              </span>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <Button href="/signup?plan=free" size="lg" className="w-full gap-2 sm:w-auto">
              Get started
              <ArrowRight className="size-4" />
            </Button>
            <Button href="/contact" variant="outline" size="lg" className="w-full sm:w-auto">
              See CRM demo
            </Button>
          </div>
        </div>

        <div className="mt-14">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}
