'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MessageSquare, Repeat2, ShieldAlert } from 'lucide-react';
import { ticketMacrosApi, ticketQueuesApi, ticketsApi } from '../../lib/extensions-api';
import { getTenantUrl } from '../../lib/tenant';
import { notifyError, notifySuccess } from '../../lib/notify';
import { ObjectChat } from '../chat/ObjectChat';
import { useSession } from '../providers/session-context';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';

const TABS = [
  { id: 'conversation', label: 'Conversation' },
  { id: 'workflow', label: 'Workflow' },
  { id: 'chat', label: 'Internal chat' },
];

function label(value) {
  return String(value || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function dateValue(value) {
  return value ? new Date(value).toLocaleString() : 'Not set';
}

function Chip({ children, tone = 'neutral' }) {
  const tones = {
    danger: 'bg-danger-light text-danger',
    warning: 'bg-warning-light text-warning',
    success: 'bg-success-light text-success',
    neutral: 'bg-muted text-muted-foreground',
    brand: 'bg-brand-light text-brand-dark',
  };
  return <span className={`inline-flex px-2.5 py-1 text-xs font-bold ${tones[tone] || tones.neutral}`}>{children}</span>;
}

function Field({ label: fieldLabel, value, danger }) {
  return (
    <div className={`border p-3 ${danger ? 'border-danger/30 bg-danger-light' : 'border-border bg-control'}`}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{fieldLabel}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value || '—'}</p>
    </div>
  );
}

export function TicketDetail({ ticketId, subdomain }) {
  const { profile } = useSession();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('conversation');
  const [replyBody, setReplyBody] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [selectedMacro, setSelectedMacro] = useState('');
  const [selectedQueue, setSelectedQueue] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');

  const { data: ticket, isLoading, error } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => ticketsApi.get(ticketId),
  });

  const { data: conversation = [] } = useQuery({
    queryKey: ['ticket-conversation', ticketId],
    queryFn: () => ticketsApi.conversation(ticketId),
  });

  const { data: queuesPage } = useQuery({
    queryKey: ['ticket-queues'],
    queryFn: () => ticketQueuesApi.list({ limit: 100, status: 'active' }),
    staleTime: 120_000,
  });

  const { data: macrosPage } = useQuery({
    queryKey: ['ticket-macros'],
    queryFn: () => ticketMacrosApi.list({ limit: 100, status: 'active' }),
    staleTime: 120_000,
  });

  const queues = useMemo(() => queuesPage?.data || queuesPage || [], [queuesPage]);
  const macros = useMemo(() => macrosPage?.data || macrosPage || [], [macrosPage]);
  const selectedMacroRecord = useMemo(() => macros.find((macro) => macro.id === selectedMacro), [macros, selectedMacro]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
    queryClient.invalidateQueries({ queryKey: ['ticket-conversation', ticketId] });
    queryClient.invalidateQueries({ queryKey: ['tickets'] });
  };

  const replyMutation = useMutation({
    mutationFn: (body) => ticketsApi.reply(ticketId, { body }),
    onSuccess: () => {
      invalidate();
      setReplyBody('');
      notifySuccess('Reply added');
    },
    onError: notifyError,
  });

  const noteMutation = useMutation({
    mutationFn: (body) => ticketsApi.note(ticketId, { body }),
    onSuccess: () => {
      invalidate();
      setNoteBody('');
      notifySuccess('Internal note added');
    },
    onError: notifyError,
  });

  const macroMutation = useMutation({
    mutationFn: () => ticketsApi.applyMacro(ticketId, { macroId: selectedMacro, body: selectedMacroRecord?.body }),
    onSuccess: () => {
      invalidate();
      setSelectedMacro('');
      notifySuccess('Macro applied');
    },
    onError: notifyError,
  });

  const routeMutation = useMutation({
    mutationFn: () => ticketsApi.route(ticketId, selectedQueue ? { queueId: selectedQueue } : {}),
    onSuccess: () => {
      invalidate();
      notifySuccess('Ticket routed');
    },
    onError: notifyError,
  });

  const resolveMutation = useMutation({
    mutationFn: () => ticketsApi.resolve(ticketId, { note: resolutionNote }),
    onSuccess: () => {
      invalidate();
      setResolutionNote('');
      notifySuccess('Ticket resolved');
    },
    onError: notifyError,
  });

  const reopenMutation = useMutation({
    mutationFn: () => ticketsApi.reopen(ticketId, { note: resolutionNote }),
    onSuccess: () => {
      invalidate();
      setResolutionNote('');
      notifySuccess('Ticket reopened');
    },
    onError: notifyError,
  });

  if (isLoading) return <div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>;
  if (error) return <div className="border border-danger/20 bg-danger-light p-6 text-sm text-danger">{error.message}</div>;
  if (!ticket) return null;

  const breached = ticket.slaBreached || ticket.firstResponseBreached || ticket.resolutionBreached;

  return (
    <div className="space-y-5">
      <Link href={getTenantUrl(subdomain, '/service/tickets')} className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-dark">
        <ArrowLeft className="h-4 w-4" />
        Back to tickets
      </Link>

      <div className="border border-border bg-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-[-0.03em] text-foreground">{ticket.name || ticket.title}</h1>
              <Chip tone={ticket.status === 'resolved' || ticket.status === 'closed' ? 'success' : 'brand'}>{label(ticket.status)}</Chip>
              <Chip tone={ticket.priority === 'urgent' || ticket.priority === 'high' ? 'warning' : 'neutral'}>{label(ticket.priority)}</Chip>
              {breached ? <Chip tone="danger">SLA breached</Chip> : null}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {label(ticket.channel)} · Queue: {ticket.queue?.name || 'Unqueued'} · Owner: {ticket.owner?.name || 'Unassigned'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Customer: {ticket.company?.name || ticket.contact?.name || 'Not linked'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => routeMutation.mutate()} disabled={routeMutation.isPending}>
              <Repeat2 className="h-4 w-4" />
              Route
            </Button>
            {ticket.status === 'resolved' || ticket.status === 'closed' ? (
              <Button type="button" variant="outline" onClick={() => reopenMutation.mutate()} disabled={reopenMutation.isPending}>Reopen</Button>
            ) : (
              <Button type="button" onClick={() => resolveMutation.mutate()} disabled={resolveMutation.isPending}>Resolve</Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Field label="First response due" value={dateValue(ticket.firstResponseDueAt)} danger={ticket.firstResponseBreached} />
        <Field label="First response at" value={dateValue(ticket.firstResponseAt)} />
        <Field label="Resolution due" value={dateValue(ticket.slaDueAt)} danger={ticket.resolutionBreached} />
        <Field label="Resolved at" value={dateValue(ticket.resolvedAt)} />
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`border-b-2 px-3 py-2 text-sm font-semibold ${
              tab === item.id ? 'border-brand text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'conversation' && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-bold text-foreground">Conversation</h2>
            </div>
            {conversation.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No replies or notes yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {conversation.map((entry) => (
                  <li key={entry.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{entry.authorName || 'Agent'}</p>
                      <Chip tone={entry.visibility === 'internal' ? 'warning' : 'neutral'}>{entry.visibility}</Chip>
                      <span className="text-xs text-muted-foreground">{dateValue(entry.createdAt)}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{entry.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <aside className="space-y-4">
            <section className="border border-border bg-card p-4">
              <h2 className="text-sm font-bold text-foreground">Reply</h2>
              <textarea className="input-base mt-3 min-h-[120px]" value={replyBody} onChange={(event) => setReplyBody(event.target.value)} placeholder="Write a public reply..." />
              <Button className="mt-3" type="button" onClick={() => replyMutation.mutate(replyBody)} disabled={!replyBody.trim() || replyMutation.isPending}>Send reply</Button>
            </section>

            <section className="border border-border bg-card p-4">
              <h2 className="text-sm font-bold text-foreground">Internal note</h2>
              <textarea className="input-base mt-3 min-h-[100px]" value={noteBody} onChange={(event) => setNoteBody(event.target.value)} placeholder="Add private context for the team..." />
              <Button className="mt-3" type="button" variant="outline" onClick={() => noteMutation.mutate(noteBody)} disabled={!noteBody.trim() || noteMutation.isPending}>Add note</Button>
            </section>
          </aside>
        </div>
      )}

      {tab === 'workflow' && (
        <div className="grid gap-5 xl:grid-cols-2">
          <section className="border border-border bg-card p-4">
            <h2 className="text-sm font-bold text-foreground">Queue routing</h2>
            <select className="input-base mt-3" value={selectedQueue} onChange={(event) => setSelectedQueue(event.target.value)}>
              <option value="">Auto-select matching queue</option>
              {queues.map((queue) => <option key={queue.id} value={queue.id}>{queue.name}</option>)}
            </select>
            <Button className="mt-3" type="button" onClick={() => routeMutation.mutate()} disabled={routeMutation.isPending}>Route ticket</Button>
          </section>

          <section className="border border-border bg-card p-4">
            <h2 className="text-sm font-bold text-foreground">Apply macro</h2>
            <select className="input-base mt-3" value={selectedMacro} onChange={(event) => setSelectedMacro(event.target.value)}>
              <option value="">Select macro...</option>
              {macros.map((macro) => <option key={macro.id} value={macro.id}>{macro.name}</option>)}
            </select>
            {selectedMacroRecord?.body ? <p className="mt-3 whitespace-pre-wrap rounded-md border border-border bg-muted p-3 text-xs text-muted-foreground">{selectedMacroRecord.body}</p> : null}
            <Button className="mt-3" type="button" onClick={() => macroMutation.mutate()} disabled={!selectedMacro || macroMutation.isPending}>Apply macro</Button>
          </section>

          <section className="border border-border bg-card p-4 xl:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-brand" />
              <h2 className="text-sm font-bold text-foreground">Resolution workflow</h2>
            </div>
            <textarea className="input-base min-h-[96px]" value={resolutionNote} onChange={(event) => setResolutionNote(event.target.value)} placeholder="Resolution or reopen note..." />
            <div className="mt-3 flex gap-2">
              <Button type="button" onClick={() => resolveMutation.mutate()} disabled={resolveMutation.isPending || ticket.status === 'resolved'}>Resolve</Button>
              <Button type="button" variant="outline" onClick={() => reopenMutation.mutate()} disabled={reopenMutation.isPending || ticket.status === 'open'}>Reopen</Button>
            </div>
          </section>
        </div>
      )}

      {tab === 'chat' && (
        <section className="border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-brand" />
            <div>
              <h2 className="text-sm font-bold text-foreground">Internal triage chat</h2>
              <p className="text-xs text-muted-foreground">Collaborate with the support team without exposing messages to the customer.</p>
            </div>
          </div>
          <ObjectChat
            entityType="Ticket"
            objectId={ticketId}
            currentUserId={profile?.user?.id}
            currentUserName={profile?.user?.name}
          />
        </section>
      )}
    </div>
  );
}
