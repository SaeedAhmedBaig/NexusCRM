'use client';

import { useEffect, useState } from 'react';
import { CreditCard, ArrowUpRight } from 'lucide-react';
import { getBillingSummary, createBillingPortal, createBillingCheckout } from '../../../../lib/api';
import { getTenantUrl } from '../../../../lib/tenant';
import { useSession } from '../../../../components/providers/session-context';
import { Can } from '../../../../components/can';
import { SettingsButton, SettingsPageShell, SettingsPrimaryButton, SettingsSection } from '../../../../components/settings/settings-layout';

export default function BillingSettingsPage() {
  const { profile, subdomain } = useSession();
  const [billing, setBilling] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getBillingSummary().then(setBilling).catch((e) => setError(e.message));
  }, []);

  async function openPortal() {
    setLoading(true);
    try {
      const returnUrl = getTenantUrl(subdomain, '/settings/billing');
      const { url } = await createBillingPortal(returnUrl);
      window.location.href = url;
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function upgrade(plan) {
    setLoading(true);
    try {
      const returnUrl = getTenantUrl(subdomain, '/settings/billing');
      const { url } = await createBillingCheckout(plan, returnUrl);
      window.location.href = url;
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Can action="manage" subject="Settings" rules={profile?.rules} fallback={<p className="text-muted">Admin access required.</p>}>
      <SettingsPageShell
        title="Billing"
        description="Plan, usage, subscription management, and invoices."
        className="max-w-4xl"
      >

        {error && <p className="text-sm text-danger">{error}</p>}

        {billing && (
          <>
            <SettingsSection
              title="Current plan"
              description={
                <>
                  {billing.plan} · {billing.status}
                  {billing.billingPeriodEnd && ` · Renews ${new Date(billing.billingPeriodEnd).toLocaleDateString()}`}
                </>
              }
              actions={<CreditCard className="h-4 w-4 text-muted-foreground" />}
            >
              <div className="space-y-4 p-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: 'Team members', used: billing.usage.users, limit: billing.limits.users },
                    { label: 'Storage (MB)', used: billing.usage.storageMb, limit: billing.limits.storageMb },
                    { label: 'Deals', used: billing.usage.deals, limit: billing.limits.deals },
                  ].map((row) => (
                    <div key={row.label} className="border border-border bg-control px-3 py-2">
                      <p className="text-xs text-muted">{row.label}</p>
                      <p className="font-semibold tabular-nums">
                        {row.used}
                        {row.limit > 0 ? ` / ${row.limit}` : row.limit === -1 ? ' / ∞' : ''}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <SettingsPrimaryButton onClick={openPortal} disabled={loading}>
                    Manage subscription <ArrowUpRight className="h-4 w-4" />
                  </SettingsPrimaryButton>
                  {['Starter', 'Free'].includes(billing.plan) && (
                    <SettingsButton onClick={() => upgrade('Professional')} disabled={loading}>Upgrade to Professional</SettingsButton>
                  )}
                  {billing.plan === 'Professional' && (
                    <SettingsButton onClick={() => upgrade('Business')} disabled={loading}>Upgrade to Business</SettingsButton>
                  )}
                  {billing.plan === 'Business' && (
                    <SettingsButton onClick={() => upgrade('Enterprise')} disabled={loading}>Upgrade to Enterprise</SettingsButton>
                  )}
                </div>
              </div>
            </SettingsSection>

            <SettingsSection title="Invoices" description="Historical subscription invoices.">
                {billing.invoices?.length ? (
                  <ul className="divide-y divide-border text-sm">
                    {billing.invoices.map((inv) => (
                      <li key={inv.id} className="flex items-center justify-between py-3">
                        <span>{new Date(inv.date).toLocaleDateString()} · ${inv.amount} {inv.currency?.toUpperCase()}</span>
                        {inv.pdfUrl && (
                          <a href={inv.pdfUrl} target="_blank" rel="noreferrer" className="text-brand hover:underline">PDF</a>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="p-4 text-sm text-muted">No invoices yet.</p>
                )}
            </SettingsSection>
          </>
        )}
      </SettingsPageShell>
    </Can>
  );
}
