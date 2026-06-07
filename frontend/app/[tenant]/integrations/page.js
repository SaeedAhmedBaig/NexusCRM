'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Plug, CheckCircle2, Circle } from 'lucide-react';
import { getIntegrations } from '../../../lib/extensions-api';
import { useSession } from '../../../components/providers/session-context';
import { getTenantUrl } from '../../../lib/tenant';
import { PageHeader } from '../../../components/ui/page-header';
import { Spinner } from '../../../components/ui/spinner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';

const STATUS_ICON = {
  connected: CheckCircle2,
  available: Circle,
  disconnected: Circle,
};

export default function IntegrationsPage() {
  const { subdomain } = useSession();
  const { data, isLoading, error } = useQuery({
    queryKey: ['integrations'],
    queryFn: getIntegrations,
  });

  if (isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>;
  }

  if (error) {
    return <div className="rounded-xl border border-danger/20 bg-danger-light p-6 text-sm text-danger">{error.message}</div>;
  }

  const integrations = data?.integrations || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrations"
        description="Connected services and available connectors"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {integrations.map((item) => {
          const Icon = STATUS_ICON[item.status] || Circle;
          const connected = item.status === 'connected';
          const inner = (
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{item.name}</CardTitle>
                  <Icon className={`h-5 w-5 shrink-0 ${connected ? 'text-success' : 'text-muted'}`} />
                </div>
                <CardDescription>{item.detail}</CardDescription>
              </CardHeader>
              <CardContent>
                <span className={`text-xs font-medium uppercase tracking-wide ${connected ? 'text-success' : 'text-muted'}`}>
                  {item.status}
                </span>
              </CardContent>
            </Card>
          );

          if (item.href) {
            return (
              <Link key={item.key} href={getTenantUrl(subdomain, item.href)}>
                {inner}
              </Link>
            );
          }
          return <div key={item.key}>{inner}</div>;
        })}
      </div>

      {data?.emailAccounts?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Email accounts</CardTitle>
            <CardDescription>Configured mail integrations</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border text-sm">
              {data.emailAccounts.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2">
                  <span>{a.email}</span>
                  <span className="text-meta">{a.provider} · {a.status}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
