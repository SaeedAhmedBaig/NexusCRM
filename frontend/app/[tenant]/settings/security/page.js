'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Download, ShieldCheck } from 'lucide-react';
import { getSecurityOverview, queueAuditExport, updateSecurityPolicy } from '../../../../lib/security-api';
import { notifyError, notifySuccess } from '../../../../lib/notify';
import { SettingsButton, SettingsPageShell, SettingsPrimaryButton, SettingsSection } from '../../../../components/settings/settings-layout';
import { Spinner } from '../../../../components/ui/spinner';
import { Can } from '../../../../components/can';
import { useSession } from '../../../../components/providers/session-context';

export default function SecurityCenterPage() {
  const queryClient = useQueryClient();
  const { profile } = useSession();
  const { data, isLoading, error } = useQuery({
    queryKey: ['security-overview'],
    queryFn: getSecurityOverview,
    refetchInterval: 30_000,
  });
  const [policyJson, setPolicyJson] = useState('');

  useEffect(() => {
    if (!data?.policy) return undefined;
    const timeout = setTimeout(() => setPolicyJson(JSON.stringify(data.policy, null, 2)), 0);
    return () => clearTimeout(timeout);
  }, [data?.policy]);

  const policyMutation = useMutation({
    mutationFn: () => updateSecurityPolicy(JSON.parse(policyJson || '{}')),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-overview'] });
      notifySuccess('Security policy saved');
    },
    onError: notifyError,
  });

  const exportMutation = useMutation({
    mutationFn: () => queueAuditExport({ name: 'Security audit export', format: 'csv' }),
    onSuccess: () => {
      notifySuccess('Audit export queued');
    },
    onError: notifyError,
  });

  if (isLoading) return <div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>;
  if (error) return <p className="text-sm text-danger">{error.message}</p>;

  return (
    <Can action="manage" subject="Security" rules={profile?.rules} fallback={<p className="text-sm text-muted-foreground">You do not have permission to manage security settings.</p>}>
    <SettingsPageShell
      title="Security Center"
      description="Workspace security policy, risk indicators, audit events, and compliance export controls."
      actions={
        <SettingsPrimaryButton onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>
          <Download className="h-4 w-4" />
          Queue audit export
        </SettingsPrimaryButton>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Active users', value: data.activeUsers },
          { label: 'Failed jobs', value: data.failedJobs },
          { label: 'Completed exports', value: data.completedExports },
        ].map((item) => (
          <div key={item.label} className="border border-border bg-card p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      <SettingsSection title="Risk signals" description="Configuration and operational issues that need admin attention.">
        {data.riskSignals?.length ? data.riskSignals.map((risk) => (
          <div key={risk.message} className="flex gap-3 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-warning" />
            <div>
              <p className="text-sm font-semibold text-foreground">{risk.message}</p>
              <p className="text-xs text-muted-foreground">Severity: {risk.severity}</p>
            </div>
          </div>
        )) : (
          <div className="flex gap-3 px-4 py-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 text-success" />
            <p className="text-sm font-semibold text-foreground">No active risk signals.</p>
          </div>
        )}
      </SettingsSection>

      <SettingsSection
        title="Security policy"
        description="Provider-agnostic MFA, session, password, and audit-retention policy stored at tenant level."
        actions={<SettingsButton onClick={() => policyMutation.mutate()} disabled={policyMutation.isPending}>Save policy</SettingsButton>}
      >
        <div className="p-4">
          <textarea className="input-base min-h-[280px] font-mono text-xs" value={policyJson} onChange={(event) => setPolicyJson(event.target.value)} />
        </div>
      </SettingsSection>

      <SettingsSection title="Recent security events" description="Authentication, file, job, mail, and governance activity.">
        {(data.recentEvents || []).map((event) => (
          <div key={event.id} className="grid gap-2 px-4 py-3 sm:grid-cols-[1fr_auto]">
            <div>
              <p className="text-sm font-semibold text-foreground">{event.summary}</p>
              <p className="text-xs text-muted-foreground">{event.source} · {event.action} · {event.actorName || 'System'}</p>
            </div>
            <p className="text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </SettingsSection>
    </SettingsPageShell>
    </Can>
  );
}
