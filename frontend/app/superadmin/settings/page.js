'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSuperadminSettings, updateSuperadminSettings } from '../../../lib/superadmin-api';
import { PageHeader } from '../../../components/ui/page-header';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Spinner } from '../../../components/ui/spinner';

const PLANS = ['Starter', 'Professional', 'Business', 'Enterprise'];

const FLAG_LABELS = {
  massmail: 'Mass mail',
  voip: 'VoIP',
  liveChat: 'Live chat',
  webForms: 'Web forms',
  customDomains: 'Custom domains',
  analytics: 'Analytics',
};

const selectClass =
  'h-9 w-full rounded-lg border border-border bg-card px-2.5 text-sm text-foreground outline-none focus:border-foreground/30 focus:ring-[3px] focus:ring-[var(--ring)]';

export default function SuperadminSettingsPage() {
  const queryClient = useQueryClient();
  const [defaultPlan, setDefaultPlan] = useState('Starter');
  const [featureFlags, setFeatureFlags] = useState({});
  const [planPricing, setPlanPricing] = useState({});
  const [savedMsg, setSavedMsg] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['superadmin-settings'],
    queryFn: getSuperadminSettings,
  });

  useEffect(() => {
    if (!data) return;
    setDefaultPlan(data.defaultPlan || 'Starter');
    setFeatureFlags(data.featureFlags || {});
    setPlanPricing(data.planPricing || {});
  }, [data]);

  const saveMut = useMutation({
    mutationFn: () => updateSuperadminSettings({ defaultPlan, featureFlags, planPricing }),
    onSuccess: () => {
      setSavedMsg('Settings saved');
      queryClient.invalidateQueries({ queryKey: ['superadmin-settings'] });
      queryClient.invalidateQueries({ queryKey: ['superadmin-stats'] });
    },
  });

  function toggleFlag(key) {
    setFeatureFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function updatePrice(plan, field, value) {
    setPlanPricing((prev) => ({
      ...prev,
      [plan]: { ...prev[plan], [field]: Number(value) || 0 },
    }));
  }

  if (isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-danger/20 bg-danger-light p-6 text-sm text-danger">
        {error.message}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="System settings"
        description="Default plans, feature flags, and pricing used for analytics"
        actions={
          <Button type="button" size="sm" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
            {saveMut.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        }
      />

      {savedMsg && (
        <p className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-foreground">{savedMsg}</p>
      )}

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">Default plan</h2>
        <p className="mt-1 text-xs text-muted-foreground">Assigned to new signups when no plan is selected</p>
        <select
          className={`${selectClass} mt-3 max-w-xs`}
          value={defaultPlan}
          onChange={(e) => setDefaultPlan(e.target.value)}
          aria-label="Default plan"
        >
          {PLANS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">Feature flags</h2>
        <p className="mt-1 text-xs text-muted-foreground">Toggle platform-wide module availability</p>
        <div className="mt-3 space-y-2">
          {Object.entries(FLAG_LABELS).map(([key, label]) => (
            <label key={key} className="flex cursor-pointer items-center justify-between rounded-lg border border-border px-3 py-2.5">
              <span className="text-sm text-foreground">{label}</span>
              <input
                type="checkbox"
                checked={featureFlags[key] !== false}
                onChange={() => toggleFlag(key)}
                className="h-4 w-4 rounded border-border"
              />
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">Plan pricing</h2>
        <p className="mt-1 text-xs text-muted-foreground">Used for MRR and revenue estimates</p>
        <div className="mt-3 space-y-4">
          {PLANS.map((plan) => (
            <div key={plan} className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium text-foreground">{plan}</p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-muted-foreground">
                  Monthly ($)
                  <Input
                    type="number"
                    min={0}
                    className="mt-1"
                    value={planPricing[plan]?.monthly ?? 0}
                    onChange={(e) => updatePrice(plan, 'monthly', e.target.value)}
                  />
                </label>
                <label className="text-xs text-muted-foreground">
                  Yearly ($/mo)
                  <Input
                    type="number"
                    min={0}
                    className="mt-1"
                    value={planPricing[plan]?.yearly ?? 0}
                    onChange={(e) => updatePrice(plan, 'yearly', e.target.value)}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
