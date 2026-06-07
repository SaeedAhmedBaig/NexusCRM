'use client';

import { Suspense } from 'react';
import { ModuleListPage } from '../../../components/crm/ModuleListPage';
import { automationApi } from '../../../lib/extensions-api';
import { COMMON_FILTERS, statusOptions, STATUS_COLUMN } from '../../../lib/module-configs';
import { Spinner } from '../../../components/ui/spinner';

function Inner() {
  return (
    <ModuleListPage
      title="Automation"
      description="Workflow rules and triggers"
      entity="automation"
      columns={[
        { key: 'name', label: 'Rule', sortKey: 'name' },
        { key: 'trigger', label: 'Trigger' },
        { key: 'action', label: 'Action' },
        STATUS_COLUMN,
      ]}
      fetchList={automationApi.list}
      createRecord={automationApi.create}
      bulkAction={automationApi.bulk}
      filters={COMMON_FILTERS}
      filterOptions={{ statuses: statusOptions('automation') }}
      createDefaults={{ status: 'inactive', trigger: 'manual', action: 'notify' }}
      createFields={[
        { key: 'name', label: 'Rule name', required: true },
        { key: 'trigger', label: 'Trigger', type: 'select', options: [
          { value: 'lead_created', label: 'Lead created' },
          { value: 'deal_stage_changed', label: 'Deal stage changed' },
          { value: 'ticket_created', label: 'Ticket created' },
          { value: 'form_submitted', label: 'Form submitted' },
          { value: 'manual', label: 'Manual' },
        ]},
        { key: 'action', label: 'Action' },
        { key: 'status', label: 'Status', type: 'select', options: statusOptions('automation') },
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
