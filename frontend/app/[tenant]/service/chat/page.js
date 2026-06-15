'use client';

import { Suspense } from 'react';
import { ModuleListPage } from '../../../../components/crm/ModuleListPage';
import { liveChatApi } from '../../../../lib/extensions-api';
import { COMMON_FILTERS, statusOptions, STATUS_COLUMN, OWNER_COLUMN } from '../../../../lib/module-configs';
import { Spinner } from '../../../../components/ui/spinner';

function Inner() {
  return (
    <ModuleListPage
      title="Live chat"
      description="Website visitor chat sessions"
      entity="live-chat"
      columns={[
        { key: 'name', label: 'Visitor', sortKey: 'visitorName' },
        { key: 'visitorEmail', label: 'Email' },
        STATUS_COLUMN,
        { key: 'lastMessage', label: 'Last message', sortable: false },
        OWNER_COLUMN,
      ]}
      fetchList={liveChatApi.list}
      getRecord={liveChatApi.get}
      createRecord={liveChatApi.create}
      updateRecord={liveChatApi.update}
      bulkAction={liveChatApi.bulk}
      filters={COMMON_FILTERS}
      filterOptions={{ statuses: statusOptions('live-chat') }}
      createDefaults={{ status: 'waiting', visitorName: 'Visitor' }}
      createFields={[
        { key: 'visitorName', label: 'Visitor name', required: true },
        { key: 'visitorEmail', label: 'Email' },
        { key: 'lastMessage', label: 'Initial message', type: 'textarea' },
        { key: 'status', label: 'Status', type: 'select', options: statusOptions('live-chat') },
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
