'use client';

import Link from 'next/link';
import { BarChart3, TrendingUp, Users, Briefcase } from 'lucide-react';
import { useSession } from '../../../components/providers/session-context';
import { getTenantUrl } from '../../../lib/tenant';
import { PageHeader } from '../../../components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';

const REPORTS = [
  {
    title: 'Sales reports',
    description: 'Revenue, won deals, and monthly forecast',
    icon: TrendingUp,
    href: '/reports/sales',
  },
  {
    title: 'Customer reports',
    description: 'Lead sources, conversion rates, and acquisition trends',
    icon: Users,
    href: '/reports/customers',
  },
  {
    title: 'Team performance',
    description: 'Deals won and tasks completed by team member',
    icon: Briefcase,
    href: '/reports/team',
  },
  {
    title: 'Full analytics',
    description: 'All charts, funnel stages, and data exports',
    icon: BarChart3,
    href: '/analytics',
  },
];

export default function ReportsPage() {
  const { subdomain } = useSession();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reporting center"
        description="Distinct reports for sales, customers, team performance, and full analytics"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {REPORTS.map((r) => {
          const Icon = r.icon;
          return (
            <Link key={r.title} href={getTenantUrl(subdomain, r.href)}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-subtle text-brand">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <CardTitle className="text-base">{r.title}</CardTitle>
                      <CardDescription className="mt-1">{r.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
