'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Ban, CalendarClock, CheckCircle, HardDrive, KeyRound, Mail, ShieldAlert, Users } from 'lucide-react';
import {
  activateSuperadminTenant,
  changeSuperadminTenantPlan,
  getSuperadminTenant,
  resetSuperadminTenantUserPassword,
  suspendSuperadminTenant,
  updateSuperadminTenantLifecycle,
} from '../../../../lib/superadmin-api';
import { PageHeader } from '../../../../components/ui/page-header';
import { StatusBadge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent } from '../../../../components/ui/card';
import { Spinner } from '../../../../components/ui/spinner';

const PLANS = ['Starter', 'Professional', 'Business', 'Enterprise'];
const STATUSES = ['trial', 'active', 'expired', 'suspended'];

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

function toDateInput(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

export default function SuperadminTenantDetailPage({ params }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [planDraft, setPlanDraft] = useState('');
  const [lifecycle, setLifecycle] = useState({ status: '', trialEndsAt: '', billingPeriodEnd: '' });
  const [passwordUserId, setPasswordUserId] = useState('');
  const [manualPassword, setManualPassword] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
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

  const lifecycleMut = useMutation({
    mutationFn: (payload) => updateSuperadminTenantLifecycle(id, payload),
    onSuccess: () => {
      setActionMsg('Tenant lifecycle updated');
      invalidate();
    },
  });

  const resetPasswordMut = useMutation({
    mutationFn: ({ userId, password }) => resetSuperadminTenantUserPassword(id, userId, password ? { password } : {}),
    onSuccess: (res) => {
      setTemporaryPassword(res.temporaryPassword || '');
      setActionMsg(res.message);
      setManualPassword('');
      invalidate();
    },
  });

  useEffect(() => {
    if (!tenant) return;
    const timer = setTimeout(() => {
      setPlanDraft(tenant.plan || 'Starter');
      setLifecycle({
        status: tenant.status || 'trial',
        trialEndsAt: toDateInput(tenant.trialEndsAt),
        billingPeriodEnd: toDateInput(tenant.billingPeriodEnd),
      });
      setPasswordUserId(tenant.users?.[0]?.userId || '');
    }, 0);
    return () => clearTimeout(timer);
  }, [tenant]);

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
  const busy = suspendMut.isPending || activateMut.isPending || planMut.isPending || lifecycleMut.isPending || resetPasswordMut.isPending;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
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

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <CalendarClock className="mt-0.5 h-4 w-4 text-brand" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">Plan and lifecycle control</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Manage plan access, subscription expiry, trial expiry, and blocked status for this tenant.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs font-medium text-muted-foreground">
              Plan
              <select className={selectClass} value={currentPlan} onChange={(e) => setPlanDraft(e.target.value)}>
                {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-xs font-medium text-muted-foreground">
              Status
              <select className={selectClass} value={lifecycle.status} onChange={(e) => setLifecycle((v) => ({ ...v, status: e.target.value }))}>
                {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-xs font-medium text-muted-foreground">
              Trial ends
              <input className={selectClass} type="date" value={lifecycle.trialEndsAt} onChange={(e) => setLifecycle((v) => ({ ...v, trialEndsAt: e.target.value }))} />
            </label>
            <label className="space-y-1 text-xs font-medium text-muted-foreground">
              Paid plan expires / renews
              <input className={selectClass} type="date" value={lifecycle.billingPeriodEnd} onChange={(e) => setLifecycle((v) => ({ ...v, billingPeriodEnd: e.target.value }))} />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={busy}
              onClick={() => lifecycleMut.mutate({
                plan: currentPlan,
                status: lifecycle.status,
                trialEndsAt: lifecycle.trialEndsAt || null,
                billingPeriodEnd: lifecycle.billingPeriodEnd || null,
                clearBlockedReason: lifecycle.status !== 'expired',
              })}
            >
              Save lifecycle
            </Button>
            <Button type="button" size="sm" variant="secondary" disabled={busy || currentPlan === tenant.plan} onClick={() => planMut.mutate(currentPlan)}>
              Apply plan only
            </Button>
          </div>
          {tenant.lifecycle?.accessBlockedReason ? (
            <p className="mt-4 rounded-lg border border-warning/30 bg-warning-light px-3 py-2 text-xs text-warning">
              <ShieldAlert className="mr-1 inline h-3.5 w-3.5" />
              {tenant.lifecycle.accessBlockedReason}
            </p>
          ) : null}
          {tenant.limits && (
            <dl className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
              <div>Users: {tenant.limits.users === -1 ? 'Unlimited' : tenant.limits.users}</div>
              <div>Storage: {tenant.limits.storageMb === -1 ? 'Unlimited' : `${tenant.limits.storageMb} MB`}</div>
              <div>Deals: {tenant.limits.deals === -1 ? 'Unlimited' : tenant.limits.deals}</div>
              <div>Emails/mo: {tenant.limits.emailsPerMonth === -1 ? 'Unlimited' : tenant.limits.emailsPerMonth}</div>
            </dl>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <KeyRound className="mt-0.5 h-4 w-4 text-brand" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">Tenant user password reset</h2>
              <p className="mt-1 text-xs text-muted-foreground">Generate a temporary password or set one manually for any tenant user.</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <select className={`${selectClass} w-full`} value={passwordUserId} onChange={(e) => setPasswordUserId(e.target.value)}>
              {(tenant.users || []).map((user) => (
                <option key={user.userId} value={user.userId}>{user.name || user.email} · {user.role}</option>
              ))}
            </select>
            <input
              className={`${selectClass} w-full`}
              type="text"
              placeholder="Optional manual password"
              value={manualPassword}
              onChange={(e) => setManualPassword(e.target.value)}
            />
            <Button
              type="button"
              size="sm"
              disabled={busy || !passwordUserId}
              onClick={() => resetPasswordMut.mutate({ userId: passwordUserId, password: manualPassword })}
            >
              Reset password
            </Button>
            {temporaryPassword ? (
              <p className="rounded-lg border border-success/30 bg-success-light px-3 py-2 text-xs text-success">
                Temporary password: <code>{temporaryPassword}</code>
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Tenant users</h2>
          <p className="mt-1 text-xs text-muted-foreground">Membership, role, verification, and login state for this workspace.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Verified</th>
                <th className="px-4 py-2">Active</th>
                <th className="px-4 py-2">Last login</th>
              </tr>
            </thead>
            <tbody>
              {(tenant.users || []).map((user) => (
                <tr key={user.userId} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{user.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </td>
                  <td className="px-4 py-3 capitalize">{user.role}</td>
                  <td className="px-4 py-3">{user.emailVerified ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3">{user.isActive && user.userActive ? 'Active' : 'Inactive'}</td>
                  <td className="px-4 py-3">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
