'use client';

import { Suspense } from 'react';
import { ModuleListPage } from '../../../../components/crm/ModuleListPage';
import { smsApi } from '../../../../lib/extensions-api';
import { COMMON_FILTERS, statusOptions, STATUS_COLUMN, OWNER_COLUMN } from '../../../../lib/module-configs';
import { Spinner } from '../../../../components/ui/spinner';

function Inner() {
  return (
    <ModuleListPage
      title="SMS marketing"
      description="SMS campaigns and broadcasts"
      entity="sms"
      columns={[
        { key: 'name', label: 'Campaign', sortKey: 'name' },
        STATUS_COLUMN,
        { key: 'recipientCount', label: 'Recipients' },
        { key: 'deliveredCount', label: 'Delivered' },
        OWNER_COLUMN,
      ]}
      fetchList={smsApi.list}
      getRecord={smsApi.get}
      createRecord={smsApi.create}
      updateRecord={smsApi.update}
      bulkAction={smsApi.bulk}
      filters={COMMON_FILTERS}
      filterOptions={{ statuses: statusOptions('sms') }}
      createDefaults={{ status: 'draft', recipientCount: 0 }}
      createFields={[
        { key: 'name', label: 'Campaign name', required: true },
        { key: 'message', label: 'Message', type: 'textarea', required: true },
        { key: 'status', label: 'Status', type: 'select', options: statusOptions('sms') },
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
