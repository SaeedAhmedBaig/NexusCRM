'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Settings, Users, Shield, Mail, User, Building2, Layers, CreditCard } from 'lucide-react';
import { getOnboardingStatus } from '../../../lib/api';
import { getTenantUrl } from '../../../lib/tenant';
import { useSession } from '../../../components/providers/session-context';
import { Can } from '../../../components/can';
import { Card } from '../../../components/ui/card';

const LINKS = [
  { href: '/settings/profile', label: 'Profile', icon: User, public: true },
  { href: '/settings/tenant', label: 'Tenant', icon: Building2, action: 'manage', subject: 'Settings' },
  { href: '/settings/users', label: 'Team', icon: Users, action: 'manage', subject: 'User' },
  { href: '/settings/departments', label: 'Roles & departments', icon: Shield, action: 'manage', subject: 'Department' },
  { href: '/settings/billing', label: 'Billing', icon: CreditCard, action: 'manage', subject: 'Settings' },
  { href: '/settings/email', label: 'Email', icon: Mail, public: true },
];

export default function SettingsPage() {
  const { profile, subdomain } = useSession();
  const [onboarding, setOnboarding] = useState(null);

  useEffect(() => {
    getOnboardingStatus().then(setOnboarding).catch(() => {});
  }, []);

  const settings = onboarding?.settings || profile?.tenant?.settings || {};
  const emailSkipped = settings.emailAccount?.skipped || settings.skippedSteps?.includes(4);

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted">Manage your workspace configuration.</p>
      </div>

      {emailSkipped && !settings.emailAccount?.configured && (
        <div className="rounded-2xl border border-warning/30 bg-warning-light p-5">
          <div className="flex gap-3">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <div>
              <p className="font-semibold text-foreground">Email not connected</p>
              <p className="mt-1 text-sm text-muted">Connect SMTP/IMAP to send mail from NexusCRM.</p>
              <Link href={getTenantUrl(subdomain, '/settings/email')} className="mt-3 inline-block text-sm font-semibold text-brand hover:text-brand-dark">
                Set up email →
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Subdomain', value: subdomain },
          { label: 'Company', value: settings.company?.name || profile?.tenant?.name || '—' },
          { label: 'Plan', value: profile?.tenant?.plan || '—' },
        ].map((item) => (
          <Card key={item.label} className="!p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">{item.label}</dt>
            <dd className="mt-2 font-semibold text-foreground">{item.value}</dd>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {LINKS.map((item) => {
          const link = (
            <Link
              key={item.href}
              href={getTenantUrl(subdomain, item.href)}
              className="card-elevated flex items-center gap-3 p-4 transition-colors hover:border-brand/30"
            >
              <item.icon className="h-5 w-5 text-brand" />
              <span className="font-medium text-foreground">{item.label}</span>
            </Link>
          );
          if (item.public) return link;
          return (
            <Can key={item.href} action={item.action} subject={item.subject} rules={profile?.rules}>
              {link}
            </Can>
          );
        })}
      </div>
    </div>
  );
}
