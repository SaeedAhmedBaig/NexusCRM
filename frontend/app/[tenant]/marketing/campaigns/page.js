'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Send } from 'lucide-react';
import { listCampaigns, createCampaign, sendCampaign } from '../../../../lib/mail-api';
import { useSession } from '../../../../components/providers/session-context';
import { getTenantUrl } from '../../../../lib/tenant';
import { PageHeader } from '../../../../components/ui/page-header';
import { Button } from '../../../../components/ui/button';
import { Spinner } from '../../../../components/ui/spinner';
import { withMutationNotify } from '../../../../lib/mutation-options';
import { EmptyState } from '../../../../components/ui/empty-state';
import { Megaphone } from 'lucide-react';

const STATUS_COLORS = {
  draft: 'bg-surface text-muted',
  scheduled: 'bg-brand-light text-brand-dark',
  sending: 'bg-warning-light text-warning',
  completed: 'bg-success-light text-success',
  failed: 'bg-danger-light text-danger',
};

export default function CampaignsPage() {
  const { subdomain } = useSession();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', recipientSource: 'contacts' });

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: listCampaigns,
  });

  const createMutation = useMutation(
    withMutationNotify({
      mutationFn: createCampaign,
      successMessage: 'Campaign created',
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['campaigns'] });
        setShowCreate(false);
      },
    }),
  );

  const sendMutation = useMutation(
    withMutationNotify({
      mutationFn: sendCampaign,
      successMessage: 'Campaign send started',
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
    }),
  );

  if (isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        description="Email marketing campaigns"
        actions={
          <div className="flex gap-2">
            <Link href={getTenantUrl(subdomain, '/massmail')}>
              <Button variant="outline">Full email studio</Button>
            </Link>
            <Button type="button" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              New campaign
            </Button>
          </div>
        }
      />

      {showCreate && (
        <form
          className="rounded-xl border border-border bg-card p-5"
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(form);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Campaign name</span>
              <input
                className="input-base"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Recipients</span>
              <select
                className="input-base"
                value={form.recipientSource}
                onChange={(e) => setForm((f) => ({ ...f, recipientSource: e.target.value }))}
              >
                <option value="contacts">All contacts</option>
                <option value="leads">All leads</option>
              </select>
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit" disabled={createMutation.isPending}>Create</Button>
            <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {!campaigns.length ? (
        <EmptyState icon={Megaphone} title="No campaigns yet" description="Create your first email campaign to reach contacts and leads." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface text-left text-meta">
              <tr>
                <th className="px-4 py-3 font-medium">Campaign</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Recipients</th>
                <th className="px-4 py-3 font-medium">Sent</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {campaigns.map((c) => (
                <tr key={c.id || c._id} className="hover:bg-surface/50">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status] || STATUS_COLORS.draft}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{c.recipientCount ?? '—'}</td>
                  <td className="px-4 py-3 tabular-nums">{c.sentCount ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    {c.status === 'draft' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sendMutation.mutate(c.id || c._id)}
                        disabled={sendMutation.isPending}
                      >
                        <Send className="h-3.5 w-3.5" />
                        Send
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
