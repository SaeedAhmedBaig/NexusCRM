'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Mail, Plus, Plug } from 'lucide-react';
import {
  listEmailAccounts,
  createEmailAccount,
  testEmailAccount,
  getGoogleOAuthUrl,
} from '../../../../lib/mail-api';
import { useSession } from '../../../../components/providers/session-context';
import { getTenantUrl } from '../../../../lib/tenant';
import { Spinner } from '../../../../components/ui/spinner';
import { SettingsButton, SettingsPageShell, SettingsPrimaryButton, SettingsSection } from '../../../../components/settings/settings-layout';

export default function EmailAccountsPage() {
  const { subdomain } = useSession();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: '',
      email: '',
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      imapHost: 'imap.gmail.com',
      imapPort: 993,
      isMain: false,
      doMassmail: true,
      doImport: true,
    },
  });

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['email-accounts'],
    queryFn: listEmailAccounts,
  });

  const createMutation = useMutation({
    mutationFn: createEmailAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-accounts'] });
      setShowForm(false);
      reset();
    },
  });

  const testMutation = useMutation({
    mutationFn: testEmailAccount,
  });

  async function connectGmail() {
    const returnUrl = getTenantUrl(subdomain, '/settings/email-accounts');
    const res = await getGoogleOAuthUrl(returnUrl);
    if (res.oauthUrl) window.location.href = res.oauthUrl;
    else alert(res.error || 'Google OAuth not configured. Set GOOGLE_CLIENT_ID in backend .env');
  }

  if (isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>;
  }

  return (
    <SettingsPageShell
      title="Email accounts"
      description="Connect SMTP/IMAP or Gmail for sending and import."
      className="max-w-4xl"
      actions={
        <>
          <SettingsButton onClick={connectGmail}>
            <Mail className="h-4 w-4" /> Connect Gmail
          </SettingsButton>
          <SettingsPrimaryButton onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" /> Add SMTP
          </SettingsPrimaryButton>
        </>
      }
    >

      {showForm && (
        <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="space-y-3 border border-border bg-card p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <input {...register('name', { required: true })} placeholder="Account name" className="border border-border bg-control px-3 py-2 text-sm text-foreground" />
            <input {...register('email', { required: true })} placeholder="Email address" className="border border-border bg-control px-3 py-2 text-sm text-foreground" />
            <input {...register('smtpHost')} placeholder="SMTP host" className="border border-border bg-control px-3 py-2 text-sm text-foreground" />
            <input type="number" {...register('smtpPort')} placeholder="SMTP port" className="border border-border bg-control px-3 py-2 text-sm text-foreground" />
            <input {...register('smtpUser')} placeholder="SMTP username" className="border border-border bg-control px-3 py-2 text-sm text-foreground" />
            <input type="password" {...register('smtpPassword')} placeholder="SMTP password" className="border border-border bg-control px-3 py-2 text-sm text-foreground" />
            <input {...register('imapHost')} placeholder="IMAP host" className="border border-border bg-control px-3 py-2 text-sm text-foreground" />
            <input type="number" {...register('imapPort')} placeholder="IMAP port" className="border border-border bg-control px-3 py-2 text-sm text-foreground" />
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" {...register('isMain')} /> Main account</label>
            <label className="flex items-center gap-2"><input type="checkbox" {...register('doMassmail')} /> Mass mail</label>
            <label className="flex items-center gap-2"><input type="checkbox" {...register('doImport')} /> IMAP import</label>
          </div>
          <SettingsPrimaryButton type="submit">Save account</SettingsPrimaryButton>
        </form>
      )}

      <SettingsSection title="Connected accounts" description="Mailboxes available for sending and import.">
        {accounts.length === 0 ? (
          <p className="p-4 text-sm text-muted">No email accounts connected yet.</p>
        ) : (
          accounts.map((acc) => (
            <div key={acc.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">{acc.name}</p>
                <p className="text-sm text-muted">{acc.email} · {acc.provider}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {acc.isMain && <span className="border border-brand/30 bg-brand-light px-2 py-0.5 text-brand-dark">Main</span>}
                  {acc.doMassmail && <span className="border border-border bg-control px-2 py-0.5 text-muted">Mass mail</span>}
                  {acc.doImport && <span className="border border-border bg-control px-2 py-0.5 text-muted">Import</span>}
                  {acc.hasOAuth && <span className="border border-success/30 bg-success-light px-2 py-0.5 text-success">OAuth</span>}
                </div>
              </div>
              <SettingsButton
                type="button"
                onClick={() => testMutation.mutate(acc.id)}
              >
                <Plug className="h-4 w-4" />
                {testMutation.isPending ? 'Testing…' : 'Test connection'}
              </SettingsButton>
            </div>
          ))
        )}
      </SettingsSection>
      {testMutation.data?.ok && <p className="text-sm text-success">Connection successful.</p>}
      {testMutation.error && <p className="text-sm text-danger">{testMutation.error.message}</p>}
    </SettingsPageShell>
  );
}
