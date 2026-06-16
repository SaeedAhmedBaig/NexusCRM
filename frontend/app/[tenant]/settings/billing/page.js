'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowUpRight, CheckCircle2, CreditCard } from 'lucide-react';
import { getBillingSummary, createBillingPortal, createBillingCheckout } from '../../../../lib/api';
import { getTenantUrl } from '../../../../lib/tenant';
import { useSession } from '../../../../components/providers/session-context';
import { Can } from '../../../../components/can';
import { SettingsButton, SettingsPageShell, SettingsPrimaryButton, SettingsSection } from '../../../../components/settings/settings-layout';

function formatLimit(limit) {
  if (limit === -1) return 'Unlimited';
  return limit;
}

function normalizePlanName(plan) {
  if (plan === 'Free') return 'Starter';
  if (plan === 'Pro') return 'Professional';
  return plan;
}

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
      >

        {error && <p className="text-sm text-danger">{error}</p>}

        {billing && (
          <>
            {billing.status === 'trial' && (
              <div className="border border-warning/30 bg-warning-light p-4 text-sm text-warning">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-semibold">Trial workspace</p>
                    <p>
                      {billing.trialEndsAt
                        ? `${billing.trialDaysRemaining ?? 0} day${billing.trialDaysRemaining === 1 ? '' : 's'} remaining. Trial ends ${new Date(billing.trialEndsAt).toLocaleDateString()}.`
                        : 'Trial is active. Choose a paid plan when you are ready to continue without interruption.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {billing.status === 'expired' && (
              <div className="border border-danger/30 bg-danger-light p-4 text-sm text-danger">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-semibold">Workspace access is blocked</p>
                    <p>Your trial or subscription has expired. Choose an active paid plan to restore access.</p>
                  </div>
                </div>
              </div>
            )}

            {billing.status === 'active' && billing.billingPeriodEnd && billing.subscriptionDaysRemaining != null && billing.subscriptionDaysRemaining <= 7 && (
              <div className="border border-warning/30 bg-warning-light p-4 text-sm text-warning">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-semibold">Plan renewal coming up</p>
                    <p>
                      Your {billing.plan} plan renews or expires in {billing.subscriptionDaysRemaining} day{billing.subscriptionDaysRemaining === 1 ? '' : 's'}.
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                    { label: 'Emails / month', used: billing.usage.emailsPerMonth || 0, limit: billing.limits.emailsPerMonth },
                  ].map((row) => (
                    <div key={row.label} className="border border-border bg-control px-3 py-2">
                      <p className="text-xs text-muted">{row.label}</p>
                      <p className="font-semibold tabular-nums">
                        {row.used}
                        {row.limit > 0 ? ` / ${row.limit}` : row.limit === -1 ? ' / Unlimited' : ''}
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

            <SettingsSection title="Plans and pricing" description="Upgrade paths are based on the existing SaaS plans configured for this workspace.">
              <div className="grid gap-3 p-4 lg:grid-cols-4">
                {(billing.availablePlans || []).map((plan) => {
                  const isCurrent = normalizePlanName(billing.plan) === plan.name;
                  const canCheckout = plan.name !== 'Starter';
                  return (
                    <div key={plan.id || plan.name} className={`flex flex-col border p-4 ${isCurrent ? 'border-brand bg-brand/5' : 'border-border bg-control'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{plan.name}</p>
                          <p className="mt-1 text-xs leading-5 text-muted">{plan.description}</p>
                        </div>
                        {isCurrent ? <span className="text-xs font-semibold text-brand">Current</span> : null}
                      </div>
                      <p className="mt-4 text-2xl font-semibold text-foreground">
                        ${plan.monthlyPrice}
                        <span className="text-xs font-normal text-muted"> / user / mo</span>
                      </p>
                      <p className="mt-1 text-xs text-muted">${plan.yearlyPrice} / user / mo billed yearly</p>
                      <div className="mt-4 space-y-2 text-xs text-muted">
                        <p>Users: {formatLimit(plan.limits?.users)}</p>
                        <p>Storage: {formatLimit(plan.limits?.storageMb)} MB</p>
                        <p>Deals: {formatLimit(plan.limits?.deals)}</p>
                      </div>
                      <ul className="mt-4 flex-1 space-y-2 text-xs text-muted">
                        {(plan.features || []).slice(0, 5).map((feature) => (
                          <li key={feature} className="flex gap-2">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <SettingsButton className="mt-4 justify-center" disabled={loading || isCurrent || !canCheckout} onClick={() => upgrade(plan.name)}>
                        {isCurrent ? 'Current plan' : canCheckout ? `Choose ${plan.name}` : 'Included'}
                      </SettingsButton>
                    </div>
                  );
                })}
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
