'use client';

import { Suspense } from 'react';
import { ModuleListPage } from '../../../../components/crm/ModuleListPage';
import { invoicesApi } from '../../../../lib/extensions-api';
import { COMMON_FILTERS, statusOptions, AMOUNT_COLUMN, STATUS_COLUMN, OWNER_COLUMN, NAME_COLUMN } from '../../../../lib/module-configs';
import { Spinner } from '../../../../components/ui/spinner';
import { useSession } from '../../../../components/providers/session-context';

function Inner() {
  const { subdomain } = useSession();
  return (
    <ModuleListPage
      title="Invoices"
      description="Sales invoices and billing"
      entity="invoices"
      detailSegment="invoices"
      subdomain={subdomain}
      columns={[NAME_COLUMN, { key: 'invoiceNumber', label: 'Invoice #' }, STATUS_COLUMN, AMOUNT_COLUMN, OWNER_COLUMN]}
      fetchList={invoicesApi.list}
      getRecord={invoicesApi.get}
      createRecord={invoicesApi.create}
      updateRecord={invoicesApi.update}
      bulkAction={invoicesApi.bulk}
      filters={COMMON_FILTERS}
      filterOptions={{ statuses: statusOptions('invoices') }}
      createDefaults={{ status: 'draft', amount: 0, currency: 'USD' }}
      createFields={[
        { key: 'title', label: 'Title', required: true },
        { key: 'invoiceNumber', label: 'Invoice number' },
        { key: 'currency', label: 'Currency' },
        { key: 'dueDate', label: 'Due date', type: 'date' },
        { key: 'terms', label: 'Terms', type: 'textarea' },
        { key: 'notes', label: 'Notes', type: 'textarea' },
        { key: 'status', label: 'Status', type: 'select', options: statusOptions('invoices') },
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
