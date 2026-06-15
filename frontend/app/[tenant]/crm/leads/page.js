'use client';

import { Suspense } from 'react';
import { CrmListPage } from '../../../../components/crm/CrmListPage';
import { useSession } from '../../../../components/providers/session-context';
import { listLeads, bulkLeads, createLead, getLead, updateLead } from '../../../../lib/crm-api';
import { Spinner } from '../../../../components/ui/spinner';

const COLUMNS = [
  { key: 'name', label: 'Lead', sortKey: 'title' },
  { key: 'source', label: 'Source' },
  { key: 'status', label: 'Status' },
  { key: 'value', label: 'Value', type: 'currency' },
  { key: 'company', label: 'Company', sortable: false, render: (_, row) => row.company?.name || '—' },
  { key: 'owner', label: 'Owner', sortable: false, render: (_, row) => row.owner?.name || '—' },
];

const FILTERS = [
  { key: 'status', label: 'Status', type: 'select' },
  { key: 'department', label: 'Department', type: 'select' },
  { key: 'owner', label: 'Owner', type: 'select' },
  { key: 'dateFrom', label: 'From date', type: 'date' },
  { key: 'dateTo', label: 'To date', type: 'date' },
];

const FILTER_OPTIONS = {
  statuses: [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'unqualified', label: 'Unqualified' },
    { value: 'converted', label: 'Converted' },
  ],
};

function LeadsListInner() {
  const { subdomain } = useSession();
  return (
    <CrmListPage
      title="Leads"
      description="Inbound and outbound prospects before conversion"
      entity="leads"
      subdomain={subdomain}
      columns={COLUMNS}
      fetchList={listLeads}
      getRecord={getLead}
      createRecord={createLead}
      updateRecord={updateLead}
      createFields={[
        { key: 'title', label: 'Lead name', required: true },
        { key: 'value', label: 'Estimated value', type: 'number' },
        { key: 'source', label: 'Source', type: 'select', options: [
          { value: 'website', label: 'Website' },
          { value: 'referral', label: 'Referral' },
          { value: 'cold_call', label: 'Cold call' },
          { value: 'trade_show', label: 'Trade show' },
          { value: 'partner', label: 'Partner' },
          { value: 'other', label: 'Other' },
        ]},
        { key: 'status', label: 'Status', type: 'select', options: FILTER_OPTIONS.statuses },
      ]}
      createDefaults={{ status: 'new', source: 'website', value: 0 }}
      bulkAction={bulkLeads}
      filters={FILTERS}
      filterOptions={FILTER_OPTIONS}
    />
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>}>
      <LeadsListInner />
    </Suspense>
  );
}
