'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Ban, CheckCircle, HardDrive, Mail, Users } from 'lucide-react';
import {
  activateSuperadminTenant,
  changeSuperadminTenantPlan,
  getSuperadminTenant,
  suspendSuperadminTenant,
} from '../../../../lib/superadmin-api';
import { PageHeader } from '../../../../components/ui/page-header';
import { StatusBadge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent } from '../../../../components/ui/card';
import { Spinner } from '../../../../components/ui/spinner';

const PLANS = ['Starter', 'Professional', 'Business', 'Enterprise'];

const selectClass =
  'h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-foreground outline-none focus:border-foreground/30 focus:ring-[3px] focus:ring-[var(--ring)]';

function UsageCard({ icon: Icon, label, value, limit }) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
            {value}
            {limit != null && limit > 0 && (
              <span className="text-sm font-normal text-muted-foreground"> / {limit}</span>
            )}
            {limit === -1 && <span className="text-sm font-normal text-muted-foreground"> (unlimited)</span>}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SuperadminTenantDetailPage({ params }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [planDraft, setPlanDraft] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const { data: tenant, isLoading, error } = useQuery({
    queryKey: ['superadmin-tenant', id],
    queryFn: () => getSuperadminTenant(id),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['superadmin-tenant', id] });
    queryClient.invalidateQueries({ queryKey: ['superadmin-tenants'] });
    queryClient.invalidateQueries({ queryKey: ['superadmin-stats'] });
  };

  const suspendMut = useMutation({
    mutationFn: () => suspendSuperadminTenant(id),
    onSuccess: (res) => { setActionMsg(res.message); invalidate(); },
  });

  const activateMut = useMutation({
    mutationFn: () => activateSuperadminTenant(id),
    onSuccess: (res) => { setActionMsg(res.message); invalidate(); },
  });

  const planMut = useMutation({
    mutationFn: (plan) => changeSuperadminTenantPlan(id, plan),
    onSuccess: (res) => {
      setActionMsg(`Plan updated to ${res.plan}`);
      invalidate();
    },
  });

  if (isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>;
  }

  if (error || !tenant) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Link href="/superadmin/tenants" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to tenants
        </Link>
        <p className="rounded-lg border border-danger/20 bg-danger-light px-4 py-3 text-sm text-danger">
          {error?.message || 'Tenant not found'}
        </p>
      </div>
    );
  }

  const currentPlan = planDraft || tenant.plan;
  const isSuspended = tenant.status === 'suspended';
  const busy = suspendMut.isPending || activateMut.isPending || planMut.isPending;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/superadmin/tenants" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to tenants
      </Link>

      <PageHeader
        title={tenant.name}
        description={
          <>
            <code className="rounded-md bg-muted px-1.5 py-0.5 text-[12px]">{tenant.subdomain}</code>
            {' · '}
            <StatusBadge status={tenant.status} />
          </>
        }
        actions={
          isSuspended ? (
            <Button type="button" size="sm" onClick={() => activateMut.mutate()} disabled={busy}>
              <CheckCircle className="h-4 w-4" />
              Activate
            </Button>
          ) : (
            <Button type="button" variant="destructive" size="sm" onClick={() => suspendMut.mutate()} disabled={busy}>
              <Ban className="h-4 w-4" />
              Suspend
            </Button>
          )
        }
      />

      {actionMsg && (
        <p className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-foreground">{actionMsg}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <UsageCard icon={Users} label="Users" value={tenant.usage.users} limit={tenant.limits?.users} />
        <UsageCard icon={Mail} label="Mass mail sent" value={tenant.usage.massMailSent.toLocaleString()} limit={tenant.limits?.emailsPerMonth} />
        <UsageCard icon={HardDrive} label="Storage (MB)" value={tenant.usage.storageMb} limit={tenant.limits?.storageMb} />
        <UsageCard icon={Users} label="Deals" value={tenant.usage.deals} limit={tenant.limits?.deals} />
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">Change plan</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Updates feature limits immediately for this workspace.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <select
            className={selectClass}
            value={currentPlan}
            onChange={(e) => setPlanDraft(e.target.value)}
            aria-label="Select plan"
          >
            {PLANS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <Button
            type="button"
            size="sm"
            disabled={busy || currentPlan === tenant.plan}
            onClick={() => planMut.mutate(currentPlan)}
          >
            Apply plan
          </Button>
        </div>
        {tenant.limits && (
          <dl className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
            <div>Users: {tenant.limits.users === -1 ? 'Unlimited' : tenant.limits.users}</div>
            <div>Storage: {tenant.limits.storageMb === -1 ? 'Unlimited' : `${tenant.limits.storageMb} MB`}</div>
            <div>Deals: {tenant.limits.deals === -1 ? 'Unlimited' : tenant.limits.deals}</div>
            <div>Emails/mo: {tenant.limits.emailsPerMonth === -1 ? 'Unlimited' : tenant.limits.emailsPerMonth}</div>
          </dl>
        )}
      </div>
    </div>
  );
}
