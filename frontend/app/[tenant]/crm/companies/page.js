'use client';

import { Suspense } from 'react';
import { CrmListPage } from '../../../../components/crm/CrmListPage';
import { useSession } from '../../../../components/providers/session-context';
import { listCompanies, bulkCompanies, createCompany, getCompany, updateCompany } from '../../../../lib/crm-api';
import { Spinner } from '../../../../components/ui/spinner';

const COLUMNS = [
  { key: 'name', label: 'Company' },
  { key: 'industry', label: 'Industry' },
  { key: 'status', label: 'Status' },
  { key: 'phone', label: 'Phone', sortable: false },
  { key: 'owner', label: 'Owner', sortable: false, render: (_, row) => row.owner?.name || '—' },
];

const FILTERS = [
  { key: 'status', label: 'Status', type: 'select' },
  { key: 'department', label: 'Department', type: 'select' },
  { key: 'owner', label: 'Owner', type: 'select' },
];

const FILTER_OPTIONS = {
  statuses: [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'prospect', label: 'Prospect' },
  ],
};

function CompaniesListInner() {
  const { subdomain } = useSession();
  return (
    <CrmListPage
      title="Companies"
      description="Organizations and accounts in your CRM"
      entity="companies"
      subdomain={subdomain}
      detailSegment="companies"
      columns={COLUMNS}
      fetchList={listCompanies}
      getRecord={getCompany}
      createRecord={createCompany}
      updateRecord={updateCompany}
      createFields={[
        { key: 'name', label: 'Company name', required: true },
        { key: 'industry', label: 'Industry' },
        { key: 'phone', label: 'Phone' },
        { key: 'status', label: 'Status', type: 'select', options: FILTER_OPTIONS.statuses },
      ]}
      createDefaults={{ status: 'active' }}
      bulkAction={bulkCompanies}
      filters={FILTERS}
      filterOptions={FILTER_OPTIONS}
    />
  );
}

export default function CompaniesPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>}>
      <CompaniesListInner />
    </Suspense>
  );
}
