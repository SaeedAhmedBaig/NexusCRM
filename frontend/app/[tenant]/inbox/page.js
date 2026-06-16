'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, Inbox, Link2, RefreshCw, Send } from 'lucide-react';
import { addInboxNote, archiveInboxThread, assignInboxThread, getInboxThread, linkInboxThread, listEmailAccounts, listInboxThreads, replyToInboxThread, syncInbox } from '../../../lib/mail-api';
import { notifyError, notifySuccess } from '../../../lib/notify';
import { PageHeader } from '../../../components/ui/page-header';
import { Button } from '../../../components/ui/button';
import { Spinner } from '../../../components/ui/spinner';
import { Can } from '../../../components/can';
import { useSession } from '../../../components/providers/session-context';

function dateText(value) {
  return value ? new Date(value).toLocaleString() : '';
}

export default function InboxPage() {
  const queryClient = useQueryClient();
  const { profile } = useSession();
  const [selectedId, setSelectedId] = useState(null);
  const [reply, setReply] = useState('');
  const [note, setNote] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [linkForm, setLinkForm] = useState({ entityType: 'Deal', entityId: '' });

  const { data: accounts = [] } = useQuery({ queryKey: ['email-accounts'], queryFn: listEmailAccounts });
  const { data: threadsPage, isLoading } = useQuery({
    queryKey: ['inbox-threads'],
    queryFn: () => listInboxThreads({ limit: 50, status: 'open' }),
    refetchInterval: 15_000,
  });
  const threads = threadsPage?.data || [];
  const activeThreadId = selectedId || threads[0]?.id;
  const { data: thread, isLoading: threadLoading } = useQuery({
    queryKey: ['inbox-thread', activeThreadId],
    queryFn: () => getInboxThread(activeThreadId),
    enabled: Boolean(activeThreadId),
  });

  const selectedAccount = useMemo(() => accounts.find((account) => account.doImport) || accounts[0], [accounts]);
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['inbox-threads'] });
    queryClient.invalidateQueries({ queryKey: ['inbox-thread', activeThreadId] });
  };

  const syncMutation = useMutation({
    mutationFn: () => syncInbox({ accountId: selectedAccount?.id }),
    onSuccess: () => {
      invalidate();
      notifySuccess('Inbox synced');
    },
    onError: notifyError,
  });

  const replyMutation = useMutation({
    mutationFn: () => replyToInboxThread(activeThreadId, { body: reply }),
    onSuccess: () => {
      setReply('');
      invalidate();
      notifySuccess('Reply added to thread');
    },
    onError: notifyError,
  });

  const noteMutation = useMutation({
    mutationFn: () => addInboxNote(activeThreadId, { body: note }),
    onSuccess: () => {
      setNote('');
      invalidate();
      notifySuccess('Internal note added');
    },
    onError: notifyError,
  });

  const actionMutation = useMutation({
    mutationFn: ({ action }) => {
      if (action === 'archive') return archiveInboxThread(activeThreadId);
      if (action === 'assign') return assignInboxThread(activeThreadId, { assignedTo });
      if (action === 'link') return linkInboxThread(activeThreadId, linkForm);
      throw new Error('Unknown action');
    },
    onSuccess: () => {
      invalidate();
      notifySuccess('Inbox thread updated');
    },
    onError: notifyError,
  });

  return (
    <Can action="read" subject="Inbox" rules={profile?.rules} fallback={<p className="text-sm text-muted-foreground">You do not have permission to access the shared inbox.</p>}>
    <div className="space-y-5">
      <PageHeader
        title="Shared Inbox"
        description="Provider-neutral team inbox for synced email threads, assignment, entity linking, replies, and internal notes."
        actions={
          <Button type="button" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending || !selectedAccount}>
            <RefreshCw className="h-4 w-4" />
            Sync inbox
          </Button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Inbox className="h-4 w-4 text-brand" />
            <h2 className="text-sm font-bold text-foreground">Open threads</h2>
          </div>
          {isLoading ? (
            <div className="flex p-8 justify-center"><Spinner /></div>
          ) : (
            <div className="divide-y divide-border">
              {threads.map((item) => (
                <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`block w-full px-4 py-3 text-left hover:bg-muted ${activeThreadId === item.id ? 'bg-muted' : ''}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="line-clamp-1 text-sm font-semibold text-foreground">{item.subject}</p>
                    {!item.read ? <span className="size-2 bg-brand" /> : null}
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{item.preview || 'No preview'}</p>
                  <p className="mt-2 text-[11px] text-muted-foreground">{dateText(item.lastMessageAt)}</p>
                </button>
              ))}
              {threads.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No synced inbox threads yet.</p> : null}
            </div>
          )}
        </section>

        <section className="border border-border bg-card">
          {!activeThreadId ? (
            <p className="p-6 text-sm text-muted-foreground">Sync an inbox account to start triaging messages.</p>
          ) : threadLoading ? (
            <div className="flex p-8 justify-center"><Spinner /></div>
          ) : (
            <div>
              <div className="border-b border-border p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-xl font-bold tracking-[-0.03em] text-foreground">{thread?.subject}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">{(thread?.participants || []).join(', ') || 'No participants'}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Linked: {thread?.linkedEntityType || 'None'} {thread?.linkedEntityId || ''}</p>
                  </div>
                  <Button type="button" variant="outline" onClick={() => actionMutation.mutate({ action: 'archive' })}>
                    <Archive className="h-4 w-4" />
                    Archive
                  </Button>
                </div>
              </div>

              <div className="divide-y divide-border">
                {(thread?.messages || []).map((message) => (
                  <article key={message.id} className={`p-4 ${message.visibility === 'internal' ? 'bg-warning-light/40' : ''}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{message.from || message.direction}</p>
                      <span className="bg-muted px-2 py-1 text-[10px] font-bold uppercase text-muted-foreground">{message.direction}</span>
                      <span className="text-xs text-muted-foreground">{dateText(message.sentAt)}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{message.bodyText || message.bodyHtml}</p>
                  </article>
                ))}
              </div>

              <div className="grid gap-4 border-t border-border p-4 lg:grid-cols-2">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Reply</h3>
                  <textarea className="input-base mt-2 min-h-[120px]" value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Write a customer-visible reply..." />
                  <Button className="mt-2" type="button" onClick={() => replyMutation.mutate()} disabled={!reply.trim() || replyMutation.isPending}>
                    <Send className="h-4 w-4" />
                    Send reply
                  </Button>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Internal note</h3>
                  <textarea className="input-base mt-2 min-h-[120px]" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Private note for the team..." />
                  <Button className="mt-2" type="button" variant="outline" onClick={() => noteMutation.mutate()} disabled={!note.trim() || noteMutation.isPending}>Add note</Button>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Assignment</h3>
                  <input className="input-base mt-2" value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)} placeholder="User ID or blank to unassign" />
                  <Button className="mt-2" type="button" variant="outline" onClick={() => actionMutation.mutate({ action: 'assign' })}>Assign</Button>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Link to CRM record</h3>
                  <div className="mt-2 grid grid-cols-[120px_1fr] gap-2">
                    <select className="input-base" value={linkForm.entityType} onChange={(event) => setLinkForm((state) => ({ ...state, entityType: event.target.value }))}>
                      {['Contact', 'Company', 'Deal', 'Ticket', 'Lead'].map((type) => <option key={type}>{type}</option>)}
                    </select>
                    <input className="input-base" value={linkForm.entityId} onChange={(event) => setLinkForm((state) => ({ ...state, entityId: event.target.value }))} placeholder="Record ID" />
                  </div>
                  <Button className="mt-2" type="button" variant="outline" onClick={() => actionMutation.mutate({ action: 'link' })}>
                    <Link2 className="h-4 w-4" />
                    Link
                  </Button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
    </Can>
  );
}
