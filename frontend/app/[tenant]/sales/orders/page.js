'use client';

import { Suspense } from 'react';
import { ModuleListPage } from '../../../../components/crm/ModuleListPage';
import { ordersApi } from '../../../../lib/extensions-api';
import { COMMON_FILTERS, statusOptions, AMOUNT_COLUMN, STATUS_COLUMN, OWNER_COLUMN, NAME_COLUMN } from '../../../../lib/module-configs';
import { Spinner } from '../../../../components/ui/spinner';
import { useSession } from '../../../../components/providers/session-context';

function Inner() {
  const { subdomain } = useSession();
  return (
    <ModuleListPage
      title="Orders"
      description="Manage customer orders"
      entity="orders"
      detailSegment="orders"
      subdomain={subdomain}
      columns={[NAME_COLUMN, { key: 'orderNumber', label: 'Order #' }, STATUS_COLUMN, AMOUNT_COLUMN, OWNER_COLUMN]}
      fetchList={ordersApi.list}
      getRecord={ordersApi.get}
      createRecord={ordersApi.create}
      updateRecord={ordersApi.update}
      bulkAction={ordersApi.bulk}
      filters={COMMON_FILTERS}
      filterOptions={{ statuses: statusOptions('orders') }}
      createDefaults={{ status: 'pending', amount: 0, currency: 'USD' }}
      createFields={[
        { key: 'title', label: 'Title', required: true },
        { key: 'orderNumber', label: 'Order number' },
        { key: 'currency', label: 'Currency' },
        { key: 'terms', label: 'Terms', type: 'textarea' },
        { key: 'notes', label: 'Notes', type: 'textarea' },
        { key: 'status', label: 'Status', type: 'select', options: statusOptions('orders') },
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
