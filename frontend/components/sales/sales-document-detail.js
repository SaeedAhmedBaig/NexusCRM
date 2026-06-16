'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Download, FileText, Repeat2 } from 'lucide-react';
import { invoicesApi, ordersApi, productsApi, quotationsApi } from '../../lib/extensions-api';
import { listEntityActivity } from '../../lib/activity-api';
import { getTenantUrl } from '../../lib/tenant';
import { notifyError, notifySuccess } from '../../lib/notify';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';

const API_BY_TYPE = {
  quotations: quotationsApi,
  orders: ordersApi,
  invoices: invoicesApi,
};

const CONFIG = {
  quotations: { entityType: 'Quotation', label: 'Quotation', backPath: '/sales/quotations', numberLabel: 'Quote number' },
  orders: { entityType: 'Order', label: 'Order', backPath: '/sales/orders', numberLabel: 'Order number' },
  invoices: { entityType: 'Invoice', label: 'Invoice', backPath: '/sales/invoices', numberLabel: 'Invoice number' },
};

const emptyLineItem = { productId: '', name: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 0 };

function money(value, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(value || 0));
}

function dateValue(value) {
  return value ? new Date(value).toLocaleDateString() : '—';
}

function downloadBlob({ blob, fileName }) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function SalesDocumentDetail({ documentId, documentType, subdomain }) {
  const api = API_BY_TYPE[documentType];
  const config = CONFIG[documentType];
  const queryClient = useQueryClient();
  const [lineItemForm, setLineItemForm] = useState(emptyLineItem);
  const [editingLineItemId, setEditingLineItemId] = useState(null);
  const [metadataForm, setMetadataForm] = useState({ terms: '', notes: '', billingAddress: '', shippingAddress: '' });

  const { data: document, isLoading, error } = useQuery({
    queryKey: [documentType, documentId],
    queryFn: () => api.get(documentId),
  });

  const { data: lineItemsPage = { items: [], totals: {} } } = useQuery({
    queryKey: [documentType, documentId, 'line-items'],
    queryFn: () => api.lineItems(documentId),
  });

  const { data: productsPage } = useQuery({
    queryKey: ['products-for-sales-documents'],
    queryFn: () => productsApi.list({ limit: 200, status: 'active' }),
    staleTime: 120_000,
  });

  const { data: activityPage } = useQuery({
    queryKey: ['entity-activity', config?.entityType, documentId],
    queryFn: () => listEntityActivity(config.entityType, documentId, { limit: 30 }),
    enabled: Boolean(config?.entityType),
  });

  const products = productsPage?.data || productsPage || [];
  const lineItems = lineItemsPage.items || [];
  const totals = lineItemsPage.totals || {};
  const activity = useMemo(() => activityPage?.data || activityPage || [], [activityPage]);

  const lineItemMutation = useMutation({
    mutationFn: (payload) => editingLineItemId
      ? api.updateLineItem(documentId, editingLineItemId, payload)
      : api.addLineItem(documentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [documentType, documentId, 'line-items'] });
      queryClient.invalidateQueries({ queryKey: [documentType, documentId] });
      queryClient.invalidateQueries({ queryKey: ['entity-activity', config.entityType, documentId] });
      setLineItemForm(emptyLineItem);
      setEditingLineItemId(null);
      notifySuccess(editingLineItemId ? 'Line item updated' : 'Line item added');
    },
    onError: notifyError,
  });

  const removeLineItemMutation = useMutation({
    mutationFn: (lineItemId) => api.removeLineItem(documentId, lineItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [documentType, documentId, 'line-items'] });
      queryClient.invalidateQueries({ queryKey: [documentType, documentId] });
      notifySuccess('Line item removed');
    },
    onError: notifyError,
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => api.update(documentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [documentType, documentId] });
      notifySuccess('Document updated');
    },
    onError: notifyError,
  });

  const pdfMutation = useMutation({
    mutationFn: () => api.downloadPdf(documentId),
    onSuccess: (file) => {
      downloadBlob(file);
      queryClient.invalidateQueries({ queryKey: ['entity-activity', config.entityType, documentId] });
      notifySuccess('PDF downloaded');
    },
    onError: notifyError,
  });

  const convertOrderMutation = useMutation({
    mutationFn: () => api.convertToOrder(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [documentType, documentId] });
      notifySuccess('Quotation converted to order');
    },
    onError: notifyError,
  });

  const convertInvoiceMutation = useMutation({
    mutationFn: () => api.convertToInvoice(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [documentType, documentId] });
      notifySuccess('Document converted to invoice');
    },
    onError: notifyError,
  });

  if (isLoading) return <div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>;
  if (error) return <div className="border border-danger/20 bg-danger-light p-6 text-sm text-danger">{error.message}</div>;
  if (!document || !config) return null;

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

  function startMetadataEdit() {
    setMetadataForm({
      terms: document.terms || '',
      notes: document.notes || '',
      billingAddress: document.billingAddress || '',
      shippingAddress: document.shippingAddress || '',
    });
  }

  function submitMetadata(event) {
    event.preventDefault();
    updateMutation.mutate(metadataForm);
  }

  return (
    <div className="space-y-5">
      <Link href={getTenantUrl(subdomain, config.backPath)} className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-dark">
        <ArrowLeft className="h-4 w-4" />
        Back to {config.label.toLowerCase()}s
      </Link>

      <div className="border border-border bg-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <FileText className="h-5 w-5 text-brand" />
              <h1 className="text-2xl font-bold tracking-[-0.03em] text-foreground">{document.name || document.title}</h1>
              <span className="border border-border bg-muted px-2.5 py-1 text-xs font-bold uppercase text-muted-foreground">{document.status}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {config.numberLabel}: {document.number || 'Draft'} · Total: {money(document.grandTotal || document.amount, document.currency)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Customer: {document.company?.name || document.contact?.name || 'Not linked'} · PDF generated: {dateValue(document.pdfGeneratedAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {documentType === 'quotations' && (
              <Button type="button" variant="outline" onClick={() => convertOrderMutation.mutate()} disabled={convertOrderMutation.isPending}>
                <Repeat2 className="h-4 w-4" />
                Convert to order
              </Button>
            )}
            {documentType !== 'invoices' && (
              <Button type="button" variant="outline" onClick={() => convertInvoiceMutation.mutate()} disabled={convertInvoiceMutation.isPending}>
                <Repeat2 className="h-4 w-4" />
                Convert to invoice
              </Button>
            )}
            <Button type="button" onClick={() => pdfMutation.mutate()} disabled={pdfMutation.isPending}>
              <Download className="h-4 w-4" />
              {pdfMutation.isPending ? 'Preparing...' : 'Download PDF'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ['Subtotal', totals.subtotal ?? document.subtotal],
          ['Discount', totals.discountTotal ?? document.discountTotal],
          ['Tax', totals.taxTotal ?? document.taxTotal],
          ['Grand total', totals.grandTotal ?? document.grandTotal ?? document.amount],
        ].map(([label, value]) => (
          <div key={label} className="border border-border bg-card p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-2 text-xl font-bold text-foreground">{money(value, document.currency)}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
        <section className="border border-border bg-card p-4">
          <h2 className="text-sm font-bold text-foreground">Line items</h2>
          <form onSubmit={submitLineItem} className="mt-4 grid gap-3 rounded-md border border-border bg-muted p-3 lg:grid-cols-6">
            <label className="grid gap-1 text-xs font-semibold text-muted-foreground lg:col-span-2">
              Product
              <select className="input-base" value={lineItemForm.productId} onChange={(e) => handleProductSelect(e.target.value)}>
                <option value="">Custom line</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>{product.name} · {money(product.unitPrice, product.currency || document.currency)}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-semibold text-muted-foreground lg:col-span-2">
              Name
              <input className="input-base" value={lineItemForm.name} onChange={(e) => updateLineItemField('name', e.target.value)} required />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
              Qty
              <input className="input-base" type="number" min="0" value={lineItemForm.quantity} onChange={(e) => updateLineItemField('quantity', e.target.value)} />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
              Unit
              <input className="input-base" type="number" min="0" value={lineItemForm.unitPrice} onChange={(e) => updateLineItemField('unitPrice', e.target.value)} />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
              Discount
              <input className="input-base" type="number" min="0" value={lineItemForm.discount} onChange={(e) => updateLineItemField('discount', e.target.value)} />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
              Tax %
              <input className="input-base" type="number" min="0" value={lineItemForm.taxRate} onChange={(e) => updateLineItemField('taxRate', e.target.value)} />
            </label>
            <div className="flex items-end gap-2 lg:col-span-4">
              <Button type="submit" disabled={lineItemMutation.isPending}>
                {editingLineItemId ? 'Save line' : 'Add line'}
              </Button>
              {editingLineItemId && (
                <Button type="button" variant="outline" onClick={() => { setEditingLineItemId(null); setLineItemForm(emptyLineItem); }}>
                  Cancel
                </Button>
              )}
            </div>
          </form>

          <div className="mt-4 overflow-x-auto">
            {lineItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No line items yet.</p>
            ) : (
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2">Item</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Discount</th>
                    <th>Tax</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item) => (
                    <tr key={item.id} className="border-b border-border last:border-0">
                      <td className="py-3 font-semibold text-foreground">{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>{money(item.unitPrice, document.currency)}</td>
                      <td>{money(item.discount, document.currency)}</td>
                      <td>{Number(item.taxRate || 0)}%</td>
                      <td className="font-semibold">{money(item.total, document.currency)}</td>
                      <td className="text-right">
                        <button type="button" className="mr-3 text-xs font-bold text-brand" onClick={() => editLineItem(item)}>Edit</button>
                        <button type="button" className="text-xs font-bold text-danger" onClick={() => removeLineItemMutation.mutate(item.id)}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground">Terms and notes</h2>
              <button type="button" className="text-xs font-bold text-brand" onClick={startMetadataEdit}>Load current</button>
            </div>
            <form onSubmit={submitMetadata} className="space-y-3">
              <textarea className="input-base min-h-[80px]" value={metadataForm.terms} onChange={(e) => setMetadataForm((current) => ({ ...current, terms: e.target.value }))} placeholder={document.terms || 'Terms'} />
              <textarea className="input-base min-h-[80px]" value={metadataForm.notes} onChange={(e) => setMetadataForm((current) => ({ ...current, notes: e.target.value }))} placeholder={document.notes || 'Notes'} />
              <textarea className="input-base min-h-[64px]" value={metadataForm.billingAddress} onChange={(e) => setMetadataForm((current) => ({ ...current, billingAddress: e.target.value }))} placeholder={document.billingAddress || 'Billing address'} />
              <textarea className="input-base min-h-[64px]" value={metadataForm.shippingAddress} onChange={(e) => setMetadataForm((current) => ({ ...current, shippingAddress: e.target.value }))} placeholder={document.shippingAddress || 'Shipping address'} />
              <Button type="submit" disabled={updateMutation.isPending}>Save details</Button>
            </form>
          </section>

          <section className="border border-border bg-card p-4">
            <h2 className="text-sm font-bold text-foreground">Activity</h2>
            {activity.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {activity.map((event) => (
                  <li key={event.id} className="py-3 text-sm">
                    <p className="font-semibold text-foreground">{event.summary}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{event.actorName || 'System'} · {new Date(event.createdAt).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
