'use client';

import { Suspense } from 'react';
import { CrmListPage } from '../../../../components/crm/CrmListPage';
import { useSession } from '../../../../components/providers/session-context';
import { listRequests, bulkRequests, createRequest, getRequest, updateRequest } from '../../../../lib/crm-api';
import { Spinner } from '../../../../components/ui/spinner';

const COLUMNS = [
  { key: 'name', label: 'Request', sortKey: 'title' },
  { key: 'status', label: 'Status' },
  { key: 'owner', label: 'Owner', sortable: false, render: (_, row) => row.owner?.name || '—' },
  { key: 'createdByUser', label: 'Created by', sortable: false, render: (_, row) => row.createdByUser?.name || '—' },
  { key: 'createdAt', label: 'Created', type: 'date' },
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
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ],
};

function RequestsListInner() {
  const { subdomain } = useSession();
  return (
    <CrmListPage
      title="Requests"
      entity="requests"
      subdomain={subdomain}
      columns={COLUMNS}
      fetchList={listRequests}
      getRecord={getRequest}
      createRecord={createRequest}
      updateRecord={updateRequest}
      createFields={[
        { key: 'title', label: 'Request title', required: true },
        { key: 'description', label: 'Description', type: 'textarea' },
      ]}
      createDefaults={{ status: 'pending' }}
      bulkAction={bulkRequests}
      filters={FILTERS}
      filterOptions={FILTER_OPTIONS}
    />
  );
}

export default function RequestsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>}>
      <RequestsListInner />
    </Suspense>
  );
}
