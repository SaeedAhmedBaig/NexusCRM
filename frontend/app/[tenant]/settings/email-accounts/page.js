'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Mail, Plus, Plug, RefreshCw } from 'lucide-react';
import {
  listEmailAccounts,
  createEmailAccount,
  testEmailAccount,
  getGoogleOAuthUrl,
} from '../../../../lib/mail-api';
import { useSession } from '../../../../components/providers/session-context';
import { getTenantUrl } from '../../../../lib/tenant';
import { Spinner } from '../../../../components/ui/spinner';

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
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Email accounts</h1>
          <p className="text-sm text-muted">Connect SMTP/IMAP or Gmail for sending and import</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={connectGmail} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium">
            <Mail className="h-4 w-4" /> Connect Gmail
          </button>
          <button type="button" onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" /> Add SMTP
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <input {...register('name', { required: true })} placeholder="Account name" className="rounded-xl border border-border px-3 py-2 text-sm" />
            <input {...register('email', { required: true })} placeholder="Email address" className="rounded-xl border border-border px-3 py-2 text-sm" />
            <input {...register('smtpHost')} placeholder="SMTP host" className="rounded-xl border border-border px-3 py-2 text-sm" />
            <input type="number" {...register('smtpPort')} placeholder="SMTP port" className="rounded-xl border border-border px-3 py-2 text-sm" />
            <input {...register('smtpUser')} placeholder="SMTP username" className="rounded-xl border border-border px-3 py-2 text-sm" />
            <input type="password" {...register('smtpPassword')} placeholder="SMTP password" className="rounded-xl border border-border px-3 py-2 text-sm" />
            <input {...register('imapHost')} placeholder="IMAP host" className="rounded-xl border border-border px-3 py-2 text-sm" />
            <input type="number" {...register('imapPort')} placeholder="IMAP port" className="rounded-xl border border-border px-3 py-2 text-sm" />
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" {...register('isMain')} /> Main account</label>
            <label className="flex items-center gap-2"><input type="checkbox" {...register('doMassmail')} /> Mass mail</label>
            <label className="flex items-center gap-2"><input type="checkbox" {...register('doImport')} /> IMAP import</label>
          </div>
          <button type="submit" className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white">Save account</button>
        </form>
      )}

      <div className="space-y-3">
        {accounts.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted">No email accounts connected yet.</p>
        ) : (
          accounts.map((acc) => (
            <div key={acc.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">{acc.name}</p>
                <p className="text-sm text-muted">{acc.email} · {acc.provider}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {acc.isMain && <span className="rounded-full bg-brand-light px-2 py-0.5 text-brand-dark">Main</span>}
                  {acc.doMassmail && <span className="rounded-full bg-surface px-2 py-0.5 text-muted">Mass mail</span>}
                  {acc.doImport && <span className="rounded-full bg-surface px-2 py-0.5 text-muted">Import</span>}
                  {acc.hasOAuth && <span className="rounded-full bg-success-light px-2 py-0.5 text-success">OAuth</span>}
                </div>
              </div>
              <button
                type="button"
                onClick={() => testMutation.mutate(acc.id)}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm"
              >
                <Plug className="h-4 w-4" />
                {testMutation.isPending ? 'Testing…' : 'Test connection'}
              </button>
            </div>
          ))
        )}
      </div>
      {testMutation.data?.ok && <p className="text-sm text-success">Connection successful.</p>}
      {testMutation.error && <p className="text-sm text-danger">{testMutation.error.message}</p>}
    </div>
  );
}
