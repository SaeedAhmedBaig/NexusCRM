'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Send, Users, Ban } from 'lucide-react';
import {
  listCampaigns,
  getCampaign,
  createCampaign,
  sendCampaign,
  previewRecipients,
  listEmailTemplates,
  listUnsubscribes,
} from '../../../lib/mail-api';
import { Spinner } from '../../../components/ui/spinner';

const STATUS_COLORS = {
  draft: 'bg-surface text-muted',
  scheduled: 'bg-brand-light text-brand-dark',
  sending: 'bg-warning-light text-warning',
  completed: 'bg-success-light text-success',
  failed: 'bg-danger-light text-danger',
};

export default function MassmailPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('campaigns');
  const [showCreate, setShowCreate] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    recipientSource: 'contacts',
    templateId: '',
    scheduledAt: '',
    businessHoursOnly: false,
  });
  const [preview, setPreview] = useState(null);

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: listCampaigns,
    refetchInterval: sendingId ? 2000 : false,
  });

  const { data: templates = [] } = useQuery({ queryKey: ['email-templates'], queryFn: listEmailTemplates });
  const { data: unsubscribes = [] } = useQuery({
    queryKey: ['unsubscribes'],
    queryFn: listUnsubscribes,
    enabled: tab === 'unsubscribes',
  });

  const createMutation = useMutation({
    mutationFn: createCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setShowCreate(false);
    },
  });

  const sendMutation = useMutation({
    mutationFn: sendCampaign,
    onSuccess: (_, id) => setSendingId(id),
  });

  const sendingCampaign = campaigns.find((c) => c.id === sendingId);
  if (sendingCampaign?.status === 'completed') setSendingId(null);

  async function handlePreview() {
    const res = await previewRecipients({
      recipientSource: form.recipientSource,
      recipientFilter: {},
    });
    setPreview(res);
  }

  if (isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mass mail</h1>
          <p className="text-sm text-muted">Create and send email campaigns</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" /> New campaign
        </button>
      </div>

      <div className="flex gap-2 border-b border-border">
        {['campaigns', 'unsubscribes'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-sm font-medium capitalize ${
              tab === t ? 'border-brand text-brand' : 'border-transparent text-muted'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'campaigns' && (
        <>
          {sendingId && sendingCampaign && (
            <div className="rounded-2xl border border-brand/30 bg-brand-light p-4">
              <p className="text-sm font-medium">Sending: {sendingCampaign.name}</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-card">
                <div
                  className="h-full bg-brand transition-all"
                  style={{ width: `${sendingCampaign.progress || Math.round((sendingCampaign.sentCount / sendingCampaign.totalCount) * 100) || 0}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted">
                {sendingCampaign.sentCount} / {sendingCampaign.totalCount} sent
              </p>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-elevated text-muted">
                  <th className="px-4 py-3">Campaign</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Sent</th>
                  <th className="px-4 py-3">Open rate</th>
                  <th className="px-4 py-3">Click rate</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3">{c.sentCount}/{c.totalCount}</td>
                    <td className="px-4 py-3">{c.openRate || 0}%</td>
                    <td className="px-4 py-3">{c.clickRate || 0}%</td>
                    <td className="px-4 py-3">
                      {c.status === 'draft' && (
                        <button
                          type="button"
                          onClick={() => sendMutation.mutate(c.id)}
                          className="inline-flex items-center gap-1 text-brand hover:underline"
                        >
                          <Send className="h-3.5 w-3.5" /> Send
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'unsubscribes' && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-muted">
            <Ban className="h-4 w-4" />
            <span className="text-sm">{unsubscribes.length} unsubscribed emails</span>
          </div>
          <ul className="divide-y divide-border">
            {unsubscribes.map((u) => (
              <li key={u.id} className="py-2 text-sm">{u.email}</li>
            ))}
          </ul>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-foreground/40" onClick={() => setShowCreate(false)} />
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Create campaign</h3>
            <div className="space-y-3">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Campaign name"
                className="w-full rounded-xl border border-border px-3 py-2 text-sm"
              />
              <select
                value={form.recipientSource}
                onChange={(e) => setForm({ ...form, recipientSource: e.target.value })}
                className="w-full rounded-xl border border-border px-3 py-2 text-sm"
              >
                <option value="contacts">Contacts</option>
                <option value="leads">Leads</option>
                <option value="companies">Companies</option>
              </select>
              <select
                value={form.templateId}
                onChange={(e) => setForm({ ...form, templateId: e.target.value })}
                className="w-full rounded-xl border border-border px-3 py-2 text-sm"
              >
                <option value="">No template</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                className="w-full rounded-xl border border-border px-3 py-2 text-sm"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.businessHoursOnly}
                  onChange={(e) => setForm({ ...form, businessHoursOnly: e.target.checked })}
                />
                Business hours only (Mon–Fri 9–5)
              </label>
              <button type="button" onClick={handlePreview} className="inline-flex items-center gap-2 text-sm text-brand">
                <Users className="h-4 w-4" /> Preview recipients
              </button>
              {preview && (
                <p className="text-sm text-muted">{preview.total} recipients (showing {preview.preview?.length})</p>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowCreate(false)} className="rounded-xl border border-border px-4 py-2 text-sm">Cancel</button>
              <button
                type="button"
                onClick={() => createMutation.mutate(form)}
                className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
