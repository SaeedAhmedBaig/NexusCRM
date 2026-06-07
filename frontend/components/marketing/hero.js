'use client';

import { ArrowRight } from 'lucide-react';
import { DashboardMockup } from './ui/dashboard-mockup';
import { Button } from '../ui/button';

export function Hero() {
  return (
    <section className="marketing-section border-b border-border bg-background pt-6 sm:pt-8">
      <div className="marketing-container grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="min-w-0 text-center lg:text-left">
          <p className="marketing-eyebrow mb-4 sm:mb-6">Enterprise multi-tenant CRM</p>

          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[3.25rem] lg:leading-[1.1]">
            Governed CRM for revenue teams at scale
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:mt-6 lg:mx-0">
            NexusCRM unifies pipeline, campaigns, and service in isolated tenant workspaces — with
            RBAC, audit trails, and SSO-ready access controls built for Fortune 500 procurement
            standards.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
            <Button href="/signup?plan=free" size="lg" className="w-full gap-2 sm:w-auto">
              Start free workspace
              <ArrowRight className="size-4" />
            </Button>
            <Button href="/contact" variant="outline" size="lg" className="w-full sm:w-auto">
              Request a demo
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
