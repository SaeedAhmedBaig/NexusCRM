'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { ArrowLeft, Mail, Pencil, Trash2, Copy, X } from 'lucide-react';
import {
  addDealLineItem,
  getDeal,
  updateDeal,
  createDeal,
  bulkDeals,
  getDealEmails,
  getDealLineItems,
  listDealPipelines,
  getDealPayments,
  getDealAttachments,
  getDealHistory,
  removeDealLineItem,
  updateDealLineItem,
  addDealPayment,
} from '../../lib/crm-api';
import { productsApi } from '../../lib/extensions-api';
import { sendEmail, syncImap } from '../../lib/mail-api';
import { listEntityActivity } from '../../lib/activity-api';
import { EmailComposer } from '../email/EmailComposer';
import { ObjectChat } from '../chat/ObjectChat';
import { useSession } from '../providers/session-context';
import { getTenantUrl } from '../../lib/tenant';
import { Spinner } from '../ui/spinner';
import { notifyError, notifySuccess } from '../../lib/notify';

const TABS = [
  { id: 'details', label: 'Details' },
  { id: 'emails', label: 'Emails' },
  { id: 'chat', label: 'Chat' },
  { id: 'line-items', label: 'Line items' },
  { id: 'payments', label: 'Payments' },
  { id: 'attachments', label: 'Attachments' },
  { id: 'history', label: 'History' },
];

function StatusBadge({ status }) {
  const colors = {
    open: 'bg-brand-light text-brand-dark',
    won: 'bg-success-light text-success',
    lost: 'bg-danger-light text-danger',
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${colors[status] || 'bg-surface text-muted'}`}>
      {status}
    </span>
  );
}

function EditDealModal({ deal, open, onClose, onSaved, stages = [] }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      name: deal?.name || deal?.title || '',
      stageKey: deal?.stageKey || deal?.stage || 'lead',
      status: deal?.status || 'open',
      amount: deal?.amount ?? deal?.value ?? 0,
      closeDate: deal?.closeDate ? deal.closeDate.slice(0, 10) : '',
      description: deal?.description || '',
    },
  });

  if (!open) return null;

  async function onSubmit(values) {
    await onSaved(values);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={handleSubmit(onSubmit)} className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit deal</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-surface"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <label className="block text-sm">
            <span className="font-medium text-muted">Name</span>
            <input {...register('name', { required: 'Required' })} className="mt-1 w-full rounded-xl border border-border px-3 py-2" />
            {errors.name && <span className="text-xs text-danger">{errors.name.message}</span>}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="font-medium text-muted">Stage</span>
              <select {...register('stageKey')} className="mt-1 w-full rounded-xl border border-border px-3 py-2">
                {(stages.length ? stages : ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'].map((s) => ({ key: s, label: s }))).map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-muted">Status</span>
              <select {...register('status')} className="mt-1 w-full rounded-xl border border-border px-3 py-2">
                {['open', 'won', 'lost'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="font-medium text-muted">Amount</span>
              <input type="number" {...register('amount', { valueAsNumber: true, min: 0 })} className="mt-1 w-full rounded-xl border border-border px-3 py-2" />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-muted">Close date</span>
              <input type="date" {...register('closeDate')} className="mt-1 w-full rounded-xl border border-border px-3 py-2" />
            </label>
          </div>
          <label className="block text-sm">
            <span className="font-medium text-muted">Description</span>
            <textarea {...register('description')} rows={3} className="mt-1 w-full rounded-xl border border-border px-3 py-2" />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {isSubmitting ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

function PaymentModal({ open, onClose, onAdd }) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: { amount: 0, status: 'pending', note: '' },
  });
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={handleSubmit(onAdd)} className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-semibold">Add payment</h3>
        <div className="space-y-3">
          <input type="number" {...register('amount', { valueAsNumber: true, required: true, min: 0.01 })} placeholder="Amount" className="w-full rounded-xl border border-border px-3 py-2" />
          <select {...register('status')} className="w-full rounded-xl border border-border px-3 py-2">
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <textarea {...register('note')} rows={2} placeholder="Note" className="w-full rounded-xl border border-border px-3 py-2" />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white">Add</button>
        </div>
      </form>
    </div>
  );
}

const emptyLineItem = { productId: '', name: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 0 };

export function DealDetail({ dealId, subdomain }) {
  const router = useRouter();
  const { profile } = useSession();
  const currentUserId = profile?.user?.id;
  const currentUserName = profile?.user?.name;
  const [tab, setTab] = useState('details');
  const [editOpen, setEditOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [lineItemForm, setLineItemForm] = useState(emptyLineItem);
  const [editingLineItemId, setEditingLineItemId] = useState(null);
  const queryClient = useQueryClient();

  const { data: deal, isLoading, error } = useQuery({
    queryKey: ['deal', dealId],
    queryFn: () => getDeal(dealId),
  });

  const { data: emails = [] } = useQuery({
    queryKey: ['deal-emails', dealId],
    queryFn: () => getDealEmails(dealId),
    enabled: tab === 'emails',
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['deal-payments', dealId],
    queryFn: () => getDealPayments(dealId),
    enabled: tab === 'payments',
  });

  const { data: pipelines = [] } = useQuery({
    queryKey: ['deal-pipelines'],
    queryFn: listDealPipelines,
    staleTime: 120_000,
  });

  const pipeline = pipelines.find((item) => item.id === deal?.pipeline?.id) || pipelines.find((item) => item.isDefault) || pipelines[0];
  const stages = pipeline?.stages || [];

  const { data: productsPage } = useQuery({
    queryKey: ['products-for-line-items'],
    queryFn: () => productsApi.list({ limit: 200, status: 'active' }),
    enabled: tab === 'line-items',
    staleTime: 120_000,
  });

  const products = productsPage?.data || productsPage || [];

  const { data: lineItemsPage = { items: [], totals: {} } } = useQuery({
    queryKey: ['deal-line-items', dealId],
    queryFn: () => getDealLineItems(dealId),
    enabled: tab === 'line-items',
  });

  const { data: attachments = [] } = useQuery({
    queryKey: ['deal-attachments', dealId],
    queryFn: () => getDealAttachments(dealId),
    enabled: tab === 'attachments',
  });

  const { data: history = [] } = useQuery({
    queryKey: ['deal-history', dealId],
    queryFn: () => getDealHistory(dealId),
    enabled: tab === 'history',
  });

  const { data: activityPage } = useQuery({
    queryKey: ['entity-activity', 'Deal', dealId],
    queryFn: () => listEntityActivity('Deal', dealId, { limit: 50 }),
    enabled: tab === 'history',
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => updateDeal(dealId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal', dealId] });
      queryClient.invalidateQueries({ queryKey: ['deal-history', dealId] });
      queryClient.invalidateQueries({ queryKey: ['entity-activity', 'Deal', dealId] });
    },
  });

  const emailMutation = useMutation({
    mutationFn: (payload) => sendEmail({ ...payload, dealId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-emails', dealId] });
      setEmailOpen(false);
    },
  });

  const syncMutation = useMutation({
    mutationFn: syncImap,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deal-emails', dealId] }),
  });

  const paymentMutation = useMutation({
    mutationFn: (payload) => addDealPayment(dealId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-payments', dealId] });
      queryClient.invalidateQueries({ queryKey: ['deal-history', dealId] });
      queryClient.invalidateQueries({ queryKey: ['entity-activity', 'Deal', dealId] });
      setPaymentOpen(false);
    },
  });

  const lineItemMutation = useMutation({
    mutationFn: (payload) => editingLineItemId
      ? updateDealLineItem(dealId, editingLineItemId, payload)
      : addDealLineItem(dealId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-line-items', dealId] });
      queryClient.invalidateQueries({ queryKey: ['deal', dealId] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-deals'] });
      queryClient.invalidateQueries({ queryKey: ['entity-activity', 'Deal', dealId] });
      setLineItemForm(emptyLineItem);
      setEditingLineItemId(null);
      notifySuccess(editingLineItemId ? 'Line item updated' : 'Line item added');
    },
    onError: notifyError,
  });

  const removeLineItemMutation = useMutation({
    mutationFn: (lineItemId) => removeDealLineItem(dealId, lineItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-line-items', dealId] });
      queryClient.invalidateQueries({ queryKey: ['deal', dealId] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-deals'] });
      notifySuccess('Line item removed');
    },
    onError: notifyError,
  });

  async function handleClone() {
    if (!deal || actionPending) return;
    setActionPending(true);
    try {
      const cloned = await createDeal({
        title: `${deal.name || deal.title} (copy)`,
        value: deal.amount ?? deal.value ?? 0,
        stage: deal.stage || 'lead',
        status: 'open',
        companyId: deal.company?.id || null,
        contactId: deal.contact?.id || null,
        description: deal.description || '',
      });
      notifySuccess('Deal cloned');
      router.push(getTenantUrl(subdomain, `/crm/deals/${cloned.id}`));
    } catch (err) {
      notifyError(err);
    } finally {
      setActionPending(false);
    }
  }

  async function handleDelete() {
    if (!deal || actionPending) return;
    if (!window.confirm('Delete this deal? This cannot be undone.')) return;
    setActionPending(true);
    try {
      await bulkDeals({ action: 'delete', ids: [dealId] });
      notifySuccess('Deal deleted');
      router.push(getTenantUrl(subdomain, '/crm/deals'));
    } catch (err) {
      notifyError(err);
    } finally {
      setActionPending(false);
    }
  }

  function updateLineItemField(key, value) {
    setLineItemForm((current) => ({ ...current, [key]: value }));
  }

  function handleProductSelect(productId) {
    const product = products.find((item) => item.id === productId);
    setLineItemForm((current) => ({
      ...current,
      productId,
      name: product?.name || current.name,
      unitPrice: product?.unitPrice ?? current.unitPrice,
      taxRate: current.taxRate || 0,
    }));
  }

  function submitLineItem(event) {
    event.preventDefault();
    lineItemMutation.mutate({
      ...lineItemForm,
      quantity: Number(lineItemForm.quantity) || 0,
      unitPrice: Number(lineItemForm.unitPrice) || 0,
      discount: Number(lineItemForm.discount) || 0,
      taxRate: Number(lineItemForm.taxRate) || 0,
    });
  }

  function editLineItem(item) {
    setEditingLineItemId(item.id);
    setLineItemForm({
      productId: item.productId || '',
      name: item.name || '',
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice || 0,
      discount: item.discount || 0,
      taxRate: item.taxRate || 0,
    });
  }

  if (isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>;
  }

  if (error || !deal) {
    return (
      <div className="rounded-2xl border border-danger/20 bg-danger-light p-6 text-sm text-danger">
        {error?.message || 'Deal not found'}
      </div>
    );
  }

  const activityEvents = activityPage?.data || [];
  const lineItems = lineItemsPage.items || [];
  const totals = lineItemsPage.totals || {};
  const timeline = activityEvents.length
    ? activityEvents.map((event) => ({
        id: event.id,
        summary: event.summary,
        actorName: event.actorName,
        createdAt: event.createdAt,
        source: event.source,
      }))
    : history.map((event) => ({
        id: event.id,
        summary: event.summary,
        actorName: event.userName,
        createdAt: event.createdAt,
        source: 'audit',
      }));

  return (
    <div className="space-y-6">
      <Link href={getTenantUrl(subdomain, '/crm/deals')} className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to deals
      </Link>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">{deal.name || deal.title}</h1>
            <StatusBadge status={deal.status} />
          </div>
          <p className="mt-1 text-sm text-muted">
            {deal.company?.name && `${deal.company.name} · `}
            {deal.owner?.name && `Owner: ${deal.owner.name}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setEditOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-surface">
            <Pencil className="h-4 w-4" /> Edit
          </button>
          <button type="button" onClick={() => setEmailOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
            <Mail className="h-4 w-4" /> Send email
          </button>
          <button
            type="button"
            onClick={handleClone}
            disabled={actionPending}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-muted hover:bg-surface disabled:opacity-50"
            title="Clone deal"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={actionPending}
            className="inline-flex items-center gap-2 rounded-xl border border-danger/30 px-3 py-2 text-sm text-danger hover:bg-danger-light disabled:opacity-50"
            title="Delete deal"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="border-b border-border">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                tab === t.id ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        {tab === 'details' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button type="button" onClick={() => setEditOpen(true)} className="text-sm font-medium text-brand hover:underline">Edit</button>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              {[
                ['Pipeline', pipeline?.name || deal.pipeline?.name || 'Default'],
                ['Stage', deal.stageKey || deal.stage],
                ['Amount', deal.amount != null ? `$${Number(deal.amount).toLocaleString()}` : '—'],
                ['Forecast', deal.forecastCategory || 'pipeline'],
                ['Next step', deal.nextStep || '—'],
                ['Close date', deal.closeDate ? new Date(deal.closeDate).toLocaleDateString() : '—'],
                ['Company', deal.company?.name || '—'],
                ['Contact', deal.contact?.name || '—'],
                ['Owner', deal.owner?.name || '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
                  <dd className="mt-1 text-sm font-medium capitalize">{value}</dd>
                </div>
              ))}
            </dl>
            {deal.description && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">Description</dt>
                <dd className="mt-1 text-sm text-foreground">{deal.description}</dd>
              </div>
            )}
          </div>
        )}

        {tab === 'emails' && (
          <div className="space-y-4">
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                className="rounded-xl border border-border px-3 py-2 text-sm font-medium"
              >
                {syncMutation.isPending ? 'Syncing…' : 'Import from IMAP'}
              </button>
              <button type="button" onClick={() => setEmailOpen(true)} className="rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white">Send email</button>
            </div>
            {emails.length === 0 ? (
              <p className="text-sm text-muted">No emails yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {emails.map((e) => (
                  <li key={e.id} className="py-3">
                    <p className="font-medium">{e.subject}</p>
                    <p className="text-xs text-muted">{e.to} · {new Date(e.sentAt).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === 'chat' && (
          <ObjectChat
            entityType="Deal"
            objectId={dealId}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
          />
        )}

        {tab === 'line-items' && (
          <div className="space-y-5">
            <form onSubmit={submitLineItem} className="rounded-xl border border-border bg-surface p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">{editingLineItemId ? 'Edit line item' : 'Add product line'}</h3>
                  <p className="text-xs text-muted">Use catalog pricing, then adjust quantity, discount, or tax.</p>
                </div>
                {editingLineItemId && (
                  <button
                    type="button"
                    className="text-xs font-semibold text-muted hover:text-foreground"
                    onClick={() => {
                      setEditingLineItemId(null);
                      setLineItemForm(emptyLineItem);
                    }}
                  >
                    Cancel edit
                  </button>
                )}
              </div>
              <div className="grid gap-3 lg:grid-cols-6">
                <label className="grid gap-1 text-xs font-semibold text-muted lg:col-span-2">
                  Product
                  <select className="input-base" value={lineItemForm.productId} onChange={(e) => handleProductSelect(e.target.value)}>
                    <option value="">Custom line item</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>{product.name} · ${Number(product.unitPrice || 0).toLocaleString()}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-semibold text-muted lg:col-span-2">
                  Name
                  <input className="input-base" value={lineItemForm.name} onChange={(e) => updateLineItemField('name', e.target.value)} required />
                </label>
                <label className="grid gap-1 text-xs font-semibold text-muted">
                  Qty
                  <input className="input-base" type="number" min="0" value={lineItemForm.quantity} onChange={(e) => updateLineItemField('quantity', e.target.value)} />
                </label>
                <label className="grid gap-1 text-xs font-semibold text-muted">
                  Unit price
                  <input className="input-base" type="number" min="0" value={lineItemForm.unitPrice} onChange={(e) => updateLineItemField('unitPrice', e.target.value)} />
                </label>
                <label className="grid gap-1 text-xs font-semibold text-muted">
                  Discount
                  <input className="input-base" type="number" min="0" value={lineItemForm.discount} onChange={(e) => updateLineItemField('discount', e.target.value)} />
                </label>
                <label className="grid gap-1 text-xs font-semibold text-muted">
                  Tax %
                  <input className="input-base" type="number" min="0" value={lineItemForm.taxRate} onChange={(e) => updateLineItemField('taxRate', e.target.value)} />
                </label>
                <div className="flex items-end lg:col-span-4">
                  <button type="submit" disabled={lineItemMutation.isPending} className="rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
                    {lineItemMutation.isPending ? 'Saving...' : editingLineItemId ? 'Save line item' : 'Add line item'}
                  </button>
                </div>
              </div>
            </form>

            {lineItems.length === 0 ? (
              <p className="text-sm text-muted">No opportunity products have been added.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted">
                      <th className="pb-2">Product</th>
                      <th className="pb-2">Qty</th>
                      <th className="pb-2">Unit</th>
                      <th className="pb-2">Discount</th>
                      <th className="pb-2">Tax</th>
                      <th className="pb-2">Total</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item) => (
                      <tr key={item.id} className="border-b border-border last:border-0">
                        <td className="py-2 font-medium">{item.name}</td>
                        <td className="py-2">{item.quantity}</td>
                        <td className="py-2">${Number(item.unitPrice || 0).toLocaleString()}</td>
                        <td className="py-2">${Number(item.discount || 0).toLocaleString()}</td>
                        <td className="py-2">{Number(item.taxRate || 0)}%</td>
                        <td className="py-2 font-semibold">${Number(item.total || 0).toLocaleString()}</td>
                        <td className="py-2 text-right">
                          <button type="button" className="mr-3 text-xs font-semibold text-brand" onClick={() => editLineItem(item)}>Edit</button>
                          <button type="button" className="text-xs font-semibold text-danger" onClick={() => removeLineItemMutation.mutate(item.id)}>Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-4">
              {[
                ['Subtotal', totals.subtotal],
                ['Discount', totals.discountTotal],
                ['Tax', totals.taxTotal],
                ['Grand total', totals.grandTotal],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-border bg-surface p-3">
                  <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
                  <p className="mt-1 text-lg font-bold">${Number(value || 0).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'payments' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button type="button" onClick={() => setPaymentOpen(true)} className="rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white">Add payment</button>
            </div>
            {payments.length === 0 ? (
              <p className="text-sm text-muted">No payments recorded.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted">
                    <th className="pb-2">Amount</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      <td className="py-2">${Number(p.amount).toLocaleString()}</td>
                      <td className="py-2 capitalize">{p.status}</td>
                      <td className="py-2">{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : new Date(p.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'attachments' && (
          attachments.length === 0 ? (
            <p className="text-sm text-muted">No attachments uploaded.</p>
          ) : (
            <ul className="divide-y divide-border">
              {attachments.map((a) => (
                <li key={a.id} className="flex justify-between py-2 text-sm">
                  <span>{a.filename}</span>
                  <span className="text-muted">{(a.size / 1024).toFixed(1)} KB</span>
                </li>
              ))}
            </ul>
          )
        )}

        {tab === 'history' && (
          timeline.length === 0 ? (
            <p className="text-sm text-muted">No activity entries yet.</p>
          ) : (
            <ul className="space-y-3">
              {timeline.map((h) => (
                <li key={h.id} className="rounded-xl border border-border px-4 py-3 text-sm">
                  <p className="font-medium">{h.summary}</p>
                  <p className="text-xs text-muted">
                    {h.actorName} · {new Date(h.createdAt).toLocaleString()} · {h.source}
                  </p>
                </li>
              ))}
            </ul>
          )
        )}
      </div>

      <EditDealModal
        deal={deal}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        stages={stages}
        onSaved={(values) => updateMutation.mutateAsync(values)}
      />
      <EmailComposer
        dealId={dealId}
        defaultSubject={`[Ticket: ${dealId?.slice(-6)}] ${deal.name || deal.title || ''}`}
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        onSend={(values) => emailMutation.mutateAsync(values)}
        loading={emailMutation.isPending}
      />
      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onAdd={(values) => paymentMutation.mutateAsync(values)}
      />
    </div>
  );
}
