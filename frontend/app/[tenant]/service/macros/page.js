'use client';

import { Suspense } from 'react';
import { ModuleListPage } from '../../../../components/crm/ModuleListPage';
import { ticketMacrosApi } from '../../../../lib/extensions-api';
import { COMMON_FILTERS, statusOptions, STATUS_COLUMN } from '../../../../lib/module-configs';
import { Spinner } from '../../../../components/ui/spinner';

function Inner() {
  return (
    <ModuleListPage
      title="Support Macros"
      description="Create reusable response templates for high-volume service workflows."
      entity="ticket-macros"
      columns={[
        { key: 'name', label: 'Macro', sortKey: 'name' },
        { key: 'category', label: 'Category' },
        { key: 'visibility', label: 'Visibility' },
        STATUS_COLUMN,
        { key: 'usageCount', label: 'Used' },
      ]}
      fetchList={ticketMacrosApi.list}
      getRecord={ticketMacrosApi.get}
      createRecord={ticketMacrosApi.create}
      updateRecord={ticketMacrosApi.update}
      bulkAction={ticketMacrosApi.bulk}
      filters={COMMON_FILTERS}
      filterOptions={{ statuses: statusOptions('ticket-macros') }}
      createDefaults={{ status: 'active', category: 'General', visibility: 'team', tags: [] }}
      createFields={[
        { key: 'name', label: 'Macro name', required: true },
        { key: 'category', label: 'Category', placeholder: 'Billing, onboarding, outage...' },
        { key: 'subject', label: 'Subject' },
        { key: 'body', label: 'Response body', type: 'textarea', required: true },
        { key: 'tags', label: 'Tags added to ticket', type: 'tags', placeholder: 'refund, escalation, vip' },
        { key: 'visibility', label: 'Visibility', type: 'select', options: [
          { value: 'team', label: 'Team' },
          { value: 'private', label: 'Private' },
        ] },
        { key: 'status', label: 'Status', type: 'select', options: statusOptions('ticket-macros') },
      ]}
    />
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>}>
      <Inner />
    </Suspense>
  );
}
