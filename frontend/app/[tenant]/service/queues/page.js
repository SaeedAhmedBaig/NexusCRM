'use client';

import { Suspense } from 'react';
import { ModuleListPage } from '../../../../components/crm/ModuleListPage';
import { ticketQueuesApi } from '../../../../lib/extensions-api';
import { COMMON_FILTERS, statusOptions, STATUS_COLUMN, OWNER_COLUMN } from '../../../../lib/module-configs';
import { Spinner } from '../../../../components/ui/spinner';

function Inner() {
  return (
    <ModuleListPage
      title="Support Queues"
      description="Route tickets by priority, department, ownership, and SLA policy."
      entity="ticket-queues"
      columns={[
        { key: 'name', label: 'Queue', sortKey: 'name' },
        { key: 'priority', label: 'Priority' },
        STATUS_COLUMN,
        OWNER_COLUMN,
      ]}
      fetchList={ticketQueuesApi.list}
      getRecord={ticketQueuesApi.get}
      createRecord={ticketQueuesApi.create}
      updateRecord={ticketQueuesApi.update}
      bulkAction={ticketQueuesApi.bulk}
      filters={COMMON_FILTERS}
      filterOptions={{ statuses: statusOptions('ticket-queues') }}
      createDefaults={{ status: 'active', priority: 'medium' }}
      createFields={[
        { key: 'name', label: 'Queue name', required: true },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'priority', label: 'Priority', type: 'select', options: [
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
          { value: 'urgent', label: 'Urgent' },
        ] },
        { key: 'status', label: 'Status', type: 'select', options: statusOptions('ticket-queues') },
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
