export const STATUS_COLS = {
  quotations: ['draft', 'sent', 'accepted', 'rejected', 'expired'],
  orders: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
  invoices: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
  products: ['active', 'draft', 'archived'],
  tickets: ['open', 'pending', 'in_progress', 'resolved', 'closed'],
  'ticket-queues': ['active', 'inactive'],
  'ticket-macros': ['active', 'inactive'],
  sms: ['draft', 'scheduled', 'sending', 'sent', 'failed'],
  knowledge: ['draft', 'published', 'archived'],
  automation: ['active', 'inactive'],
  'report-export-jobs': ['queued', 'running', 'completed', 'failed', 'cancelled'],
  'live-chat': ['waiting', 'active', 'closed'],
};

export function statusOptions(entity) {
  return (STATUS_COLS[entity] || []).map((s) => ({
    value: s,
    label: s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  }));
}

export const COMMON_FILTERS = [
  { key: 'status', label: 'Status', type: 'select' },
  { key: 'dateFrom', label: 'From date', type: 'date' },
  { key: 'dateTo', label: 'To date', type: 'date' },
];

export const AMOUNT_COLUMN = { key: 'amount', label: 'Amount', type: 'currency' };
export const STATUS_COLUMN = { key: 'status', label: 'Status' };
export const OWNER_COLUMN = {
  key: 'owner',
  label: 'Owner',
  sortable: false,
  render: (_, row) => row.owner?.name || '—',
};
export const NAME_COLUMN = { key: 'name', label: 'Name', sortKey: 'title' };
