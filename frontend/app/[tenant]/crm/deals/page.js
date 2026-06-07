'use client';

import { Suspense } from 'react';
import { CrmListPage } from '../../../../components/crm/CrmListPage';
import { useSession } from '../../../../components/providers/session-context';
import { listDeals, bulkDeals, createDeal } from '../../../../lib/crm-api';
import { Spinner } from '../../../../components/ui/spinner';

const COLUMNS = [
  { key: 'name', label: 'Deal', sortKey: 'title' },
  { key: 'company', label: 'Company', sortable: false, render: (_, row) => row.company?.name || '—' },
  { key: 'stage', label: 'Stage' },
  { key: 'amount', label: 'Amount', type: 'currency', sortKey: 'value' },
  { key: 'closeDate', label: 'Close date', type: 'date' },
  { key: 'owner', label: 'Owner', sortable: false, render: (_, row) => row.owner?.name || '—' },
  { key: 'status', label: 'Status' },
];

const FILTERS = [
  { key: 'status', label: 'Status', type: 'select' },
  { key: 'stage', label: 'Stage', type: 'select' },
  { key: 'department', label: 'Department', type: 'select' },
  { key: 'owner', label: 'Owner', type: 'select' },
  { key: 'dateFrom', label: 'From date', type: 'date' },
  { key: 'dateTo', label: 'To date', type: 'date' },
];

const FILTER_OPTIONS = {
  statuses: [
    { value: 'open', label: 'Open' },
    { value: 'won', label: 'Won' },
    { value: 'lost', label: 'Lost' },
  ],
  stage: [
    { value: 'lead', label: 'Lead' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'proposal', label: 'Proposal' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'won', label: 'Won' },
    { value: 'lost', label: 'Lost' },
  ],
};

function DealsListInner() {
  const { subdomain } = useSession();

  return (
    <CrmListPage
      title="Deals"
      description="Manage your sales pipeline and opportunities"
      entity="deals"
      subdomain={subdomain}
      detailSegment="deals"
      columns={COLUMNS}
      fetchList={listDeals}
      createRecord={createDeal}
      createFields={[
        { key: 'title', label: 'Deal name', required: true },
        { key: 'value', label: 'Amount', type: 'number' },
        { key: 'stage', label: 'Stage', type: 'select', options: FILTER_OPTIONS.stage },
      ]}
      createDefaults={{ stage: 'lead', value: 0 }}
      bulkAction={bulkDeals}
      filters={FILTERS}
      filterOptions={FILTER_OPTIONS}
    />
  );
}

export default function DealsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>}>
      <DealsListInner />
    </Suspense>
  );
}
