'use client';

import { ArrowRight } from 'lucide-react';
import { DashboardMockup } from './ui/dashboard-mockup';
import { Button } from '../ui/button';

export function Hero() {
  return (
    <section className="marketing-section border-b border-border bg-background pt-8">
      <div className="marketing-container grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="marketing-eyebrow mb-6">Enterprise multi-tenant CRM</p>

          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
            Governed CRM for revenue teams at scale
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
            NexusCRM unifies pipeline, campaigns, and service in isolated tenant workspaces — with
            RBAC, audit trails, and SSO-ready access controls built for Fortune 500 procurement
            standards.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/signup?plan=free" size="lg" className="gap-2">
              Start free workspace
              <ArrowRight className="size-4" />
            </Button>
            <Button href="/contact" variant="outline" size="lg">
              Request a demo
            </Button>
          </div>
        </div>

        <DashboardMockup />
      </div>
    </section>
  );
}
