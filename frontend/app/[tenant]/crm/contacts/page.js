'use client';

import { Suspense } from 'react';
import { CrmListPage } from '../../../../components/crm/CrmListPage';
import { useSession } from '../../../../components/providers/session-context';
import { listContacts, bulkContacts, createContact, getContact, updateContact } from '../../../../lib/crm-api';
import { Spinner } from '../../../../components/ui/spinner';

const COLUMNS = [
  { key: 'name', label: 'Name', sortKey: 'firstName' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone', sortable: false },
  { key: 'jobTitle', label: 'Title', sortable: false },
  { key: 'company', label: 'Company', sortable: false, render: (_, row) => row.company?.name || '—' },
  { key: 'status', label: 'Status' },
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
    { value: 'lead', label: 'Lead' },
  ],
};

function ContactsListInner() {
  const { subdomain } = useSession();
  return (
    <CrmListPage
      title="Contacts"
      description="People linked to companies and deals"
      entity="contacts"
      subdomain={subdomain}
      columns={COLUMNS}
      fetchList={listContacts}
      getRecord={getContact}
      createRecord={createContact}
      updateRecord={updateContact}
      createFields={[
        { key: 'firstName', label: 'First name', required: true },
        { key: 'lastName', label: 'Last name' },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'phone', label: 'Phone' },
        { key: 'jobTitle', label: 'Job title' },
        { key: 'status', label: 'Status', type: 'select', options: FILTER_OPTIONS.statuses },
      ]}
      createDefaults={{ status: 'active' }}
      bulkAction={bulkContacts}
      filters={FILTERS}
      filterOptions={FILTER_OPTIONS}
    />
  );
}

export default function ContactsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>}>
      <ContactsListInner />
    </Suspense>
  );
}
