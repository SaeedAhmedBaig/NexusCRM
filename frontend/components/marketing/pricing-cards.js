'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PricingCards({ plansData }) {
  const [billing, setBilling] = useState('monthly');
  const plans = plansData?.plans || [];

  return (
    <section id="pricing" className="marketing-section bg-background">
      <div className="marketing-container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="marketing-eyebrow mb-4">Pricing</p>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Transparent plans for every stage
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Start with a free workspace and scale as your team and compliance requirements grow.
          </p>

          <div className="mt-8 inline-flex items-center rounded-md border border-border bg-muted p-1">
            <button
              type="button"
              className={cn(
                'rounded px-4 py-2 text-sm font-medium transition-colors',
                billing === 'monthly'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => setBilling('monthly')}
              aria-pressed={billing === 'monthly'}
            >
              Monthly
            </button>
            <button
              type="button"
              className={cn(
                'rounded px-4 py-2 text-sm font-medium transition-colors',
                billing === 'yearly'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => setBilling('yearly')}
              aria-pressed={billing === 'yearly'}
            >
              Yearly
            </button>
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {plans.map((plan) => {
            const price = billing === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
            const isFree = price === 0;

            return (
              <article
                key={plan.id}
                className={cn(
                  'relative flex flex-col rounded-lg border bg-card p-6',
                  plan.popular ? 'border-foreground' : 'border-border',
                )}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-border bg-muted px-3 py-0.5 text-xs font-medium text-foreground">
                    Recommended
                  </span>
                )}
                <h3 className="text-base font-semibold text-foreground">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tracking-tight text-foreground">
                    {isFree ? 'Free' : `$${price}`}
                  </span>
                  {!isFree && (
                    <span className="text-sm text-muted-foreground">/user/mo</span>
                  )}
                </div>
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <Check className="mt-0.5 size-4 shrink-0 text-foreground" strokeWidth={2} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/signup?plan=${plan.slug || plan.id}`}
                  className={cn(
                    'mt-6 inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-medium transition-colors',
                    plan.popular
                      ? 'bg-brand text-brand-foreground hover:opacity-90'
                      : 'border border-border bg-background text-foreground hover:bg-muted',
                  )}
                >
                  {isFree ? 'Start free workspace' : `Start ${plan.name}`}
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
