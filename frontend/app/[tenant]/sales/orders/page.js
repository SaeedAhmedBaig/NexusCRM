'use client';

import { Suspense } from 'react';
import { ModuleListPage } from '../../../../components/crm/ModuleListPage';
import { ordersApi } from '../../../../lib/extensions-api';
import { COMMON_FILTERS, statusOptions, AMOUNT_COLUMN, STATUS_COLUMN, OWNER_COLUMN, NAME_COLUMN } from '../../../../lib/module-configs';
import { Spinner } from '../../../../components/ui/spinner';

function Inner() {
  return (
    <ModuleListPage
      title="Orders"
      description="Manage customer orders"
      entity="orders"
      columns={[NAME_COLUMN, { key: 'orderNumber', label: 'Order #' }, STATUS_COLUMN, AMOUNT_COLUMN, OWNER_COLUMN]}
      fetchList={ordersApi.list}
      createRecord={ordersApi.create}
      bulkAction={ordersApi.bulk}
      filters={COMMON_FILTERS}
      filterOptions={{ statuses: statusOptions('orders') }}
      createDefaults={{ status: 'pending', amount: 0 }}
      createFields={[
        { key: 'title', label: 'Title', required: true },
        { key: 'orderNumber', label: 'Order number' },
        { key: 'amount', label: 'Amount', type: 'number' },
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
