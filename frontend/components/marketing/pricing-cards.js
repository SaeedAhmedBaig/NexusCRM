'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FALLBACK_PLANS } from '@/lib/plans';

export function PricingCards({ plansData }) {
  const [billing, setBilling] = useState('monthly');
  const plans = plansData?.plans?.length >= 4 ? plansData.plans : FALLBACK_PLANS.plans;

  return (
    <section id="pricing" className="marketing-section bg-background">
      <div className="marketing-container">
        <div className="marketing-section-header">
          <p className="marketing-eyebrow mb-4">Pricing</p>
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl">
            Choose the workspace that matches your customer journey
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Four clear plans, one consistent product. Start small, then add automation, reporting,
            and governance as your team grows.
          </p>

          <div className="mt-8 inline-flex items-center rounded-full border border-border bg-card p-1 shadow-sm">
            <button
              type="button"
              className={cn(
                'rounded-full px-5 py-2.5 text-sm font-semibold transition-colors',
                billing === 'monthly'
                  ? 'bg-brand text-brand-foreground shadow-sm'
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
                'rounded-full px-5 py-2.5 text-sm font-semibold transition-colors',
                billing === 'yearly'
                  ? 'bg-brand text-brand-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => setBilling('yearly')}
              aria-pressed={billing === 'yearly'}
            >
              Yearly <span className="ml-1 hidden text-current/70 sm:inline">save 15%</span>
            </button>
          </div>
        </div>

        <div className="mt-12 grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const price = billing === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
            const isFree = price === 0;
            const isEnterprise = plan.slug === 'enterprise' || plan.id === 'enterprise';

            return (
              <article
                key={plan.id}
                className={cn(
                  'relative flex h-full flex-col rounded-[2rem] border bg-card p-5 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md',
                  plan.popular
                    ? 'border-brand ring-4 ring-brand/10'
                    : 'border-border',
                )}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-brand-foreground shadow-sm">
                    Most popular
                  </span>
                )}
                <div className="flex min-h-28 flex-col">
                  <h3 className="text-base font-semibold text-foreground">{plan.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{plan.description}</p>
                </div>
                <div className="mt-5 flex items-end gap-1">
                  <span className="text-4xl font-semibold tracking-[-0.04em] text-foreground">
                    {isEnterprise ? 'Custom' : isFree ? 'Free' : `$${price}`}
                  </span>
                  {!isFree && !isEnterprise && (
                    <span className="pb-1 text-sm font-medium text-muted-foreground">/user/mo</span>
                  )}
                </div>
                <p className="mt-2 text-xs font-medium text-muted-foreground">
                  {billing === 'yearly' && !isFree && !isEnterprise
                    ? 'Billed yearly for better value'
                    : isEnterprise
                      ? 'Built around your security needs'
                      : 'No credit card required'}
                </p>
                <ul className="mt-6 flex-1 space-y-3 border-t border-border pt-5">
                  {plan.features.slice(0, 6).map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={2.2} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/signup?plan=${plan.slug || plan.id}`}
                  className={cn(
                    'mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors',
                    plan.popular
                      ? 'bg-brand text-brand-foreground hover:bg-brand-dark'
                      : 'border border-border bg-control text-foreground hover:bg-control-hover',
                  )}
                >
                  {isEnterprise ? 'Contact sales' : isFree ? 'Start free' : `Start ${plan.name}`}
                  <ArrowRight className="size-4" />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
