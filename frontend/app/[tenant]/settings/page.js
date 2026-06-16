'use client';

import { useEffect, useState } from 'react';
import { Users, Mail, User, Building2, CreditCard, SlidersHorizontal, ShieldCheck, Database, Layers, Settings2, GitBranch } from 'lucide-react';
import { getOnboardingStatus } from '../../../lib/api';
import { getTenantUrl } from '../../../lib/tenant';
import { useSession } from '../../../components/providers/session-context';
import { Can } from '../../../components/can';
import { SettingsPageShell, SettingsRow, SettingsSection } from '../../../components/settings/settings-layout';

const SETTINGS_GROUPS = [
  {
    title: 'Account',
    description: 'Personal defaults for the current user.',
    items: [
      { href: '/settings/profile', label: 'Profile', description: 'Name, email, password, language, and notifications.', icon: User, public: true },
      { href: '/settings/email', label: 'Email setup', description: 'Connect SMTP details used during onboarding and outbound mail.', icon: Mail, public: true },
    ],
  },
  {
    title: 'Workspace',
    description: 'Organization identity, access, and commercial settings.',
    items: [
      { href: '/settings/tenant', label: 'Organization', description: 'Company profile, workspace URL, domains, and defaults.', icon: Building2, action: 'manage', subject: 'Settings' },
      { href: '/settings/users', label: 'Team members', description: 'Invite people, assign departments, and manage membership.', icon: Users, action: 'manage', subject: 'User' },
      { href: '/settings/departments', label: 'Departments and roles', description: 'Department defaults, role groups, and permission presets.', icon: Layers, action: 'manage', subject: 'Department' },
      { href: '/settings/lead-routing', label: 'Lead routing', description: 'Route leads by source, status, score, department, and value.', icon: GitBranch, action: 'manage', subject: 'Settings' },
      { href: '/settings/pipelines', label: 'Pipelines', description: 'Configure opportunity stages, probabilities, and won/lost gates.', icon: GitBranch, action: 'manage', subject: 'Settings' },
      { href: '/settings/billing', label: 'Billing', description: 'Subscription, invoices, and plan usage.', icon: CreditCard, action: 'manage', subject: 'Settings' },
    ],
  },
  {
    title: 'Platform',
    description: 'Enterprise metadata, audit, and operational controls.',
    items: [
      { href: '/settings/custom-fields', label: 'Custom fields', description: 'Tenant metadata fields used by CRM forms and records.', icon: SlidersHorizontal, action: 'manage', subject: 'Settings' },
      { href: '/settings/security', label: 'Security center', description: 'MFA/session policy, risk signals, and audit export controls.', icon: ShieldCheck, action: 'manage', subject: 'Settings' },
      { href: '/settings/audit', label: 'Audit stream', description: 'Tenant-scoped activity stream and governance review.', icon: ShieldCheck, action: 'manage', subject: 'Settings' },
      { href: '/settings/data-jobs', label: 'Data jobs', description: 'Imports, exports, sync jobs, and enrichment operations.', icon: Database, action: 'manage', subject: 'Settings' },
    ],
  },
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
    <SettingsPageShell
      title="Settings"
      description="Manage workspace configuration, access, metadata, and operational controls."
    >

      {emailSkipped && !settings.emailAccount?.configured && (
        <SettingsSection title="Attention required" description="A workspace setup item needs completion.">
          <SettingsRow
            icon={Mail}
            label="Email is not connected"
            description="Connect SMTP/IMAP to send mail from NexusCRM."
            href={getTenantUrl(subdomain, '/settings/email')}
            value="Open"
          />
        </SettingsSection>
      )}

      <div className="grid border border-border bg-card sm:grid-cols-3">
        {[
          { label: 'Subdomain', value: subdomain },
          { label: 'Company', value: settings.company?.name || profile?.tenant?.name || '—' },
          { label: 'Plan', value: profile?.tenant?.plan || '—' },
        ].map((item) => (
          <div key={item.label} className="border-b border-border px-4 py-3 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</dt>
            <dd className="mt-2 font-semibold text-foreground">{item.value}</dd>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <aside className="border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              Preferences
            </p>
          </div>
          <nav className="divide-y divide-border text-sm">
            {SETTINGS_GROUPS.map((group) => (
              <a key={group.title} href={`#${group.title.toLowerCase()}`} className="block px-4 py-3 text-muted-foreground hover:bg-muted/50 hover:text-foreground">
                {group.title}
              </a>
            ))}
          </nav>
        </aside>

        <div className="space-y-4">
          {SETTINGS_GROUPS.map((group) => (
            <SettingsSection key={group.title} title={group.title} description={group.description}>
              {group.items.map((item) => {
                const row = (
                  <SettingsRow
                    key={item.href}
                    icon={item.icon}
                    label={item.label}
                    description={item.description}
                    href={getTenantUrl(subdomain, item.href)}
                    value="Configure"
                  />
                );
                if (item.public) return row;
                return (
                  <Can key={item.href} action={item.action} subject={item.subject} rules={profile?.rules}>
                    {row}
                  </Can>
                );
              })}
            </SettingsSection>
          ))}
        </div>
      </div>
    </SettingsPageShell>
  );
}
