'use client';

import { Suspense } from 'react';
import { ModuleListPage } from '../../../../components/crm/ModuleListPage';
import { ticketsApi } from '../../../../lib/extensions-api';
import { COMMON_FILTERS, statusOptions, STATUS_COLUMN, OWNER_COLUMN, NAME_COLUMN } from '../../../../lib/module-configs';
import { Spinner } from '../../../../components/ui/spinner';

function Inner() {
  return (
    <ModuleListPage
      title="Support tickets"
      description="Customer support requests, ownership, SLA state, and resolution workflow"
      entity="tickets"
      columns={[
        NAME_COLUMN,
        { key: 'priority', label: 'Priority' },
        STATUS_COLUMN,
        { key: 'slaDueAt', label: 'SLA due', type: 'date' },
        { key: 'resolvedAt', label: 'Resolved', type: 'date' },
        OWNER_COLUMN,
      ]}
      fetchList={ticketsApi.list}
      getRecord={ticketsApi.get}
      createRecord={ticketsApi.create}
      updateRecord={ticketsApi.update}
      bulkAction={ticketsApi.bulk}
      filters={[...COMMON_FILTERS, { key: 'owner', label: 'Assignee', type: 'select' }]}
      filterOptions={{
        statuses: statusOptions('tickets'),
      }}
      createDefaults={{ status: 'open', priority: 'medium' }}
      createFields={[
        { key: 'title', label: 'Subject', required: true },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'internalNotes', label: 'Internal notes', type: 'textarea' },
        { key: 'priority', label: 'Priority', type: 'select', options: [
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
          { value: 'urgent', label: 'Urgent' },
        ]},
        { key: 'status', label: 'Status', type: 'select', options: statusOptions('tickets') },
        { key: 'slaDueAt', label: 'SLA due date', type: 'date' },
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
