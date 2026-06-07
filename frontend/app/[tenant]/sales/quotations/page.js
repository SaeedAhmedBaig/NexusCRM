'use client';

import { Suspense } from 'react';
import { ModuleListPage } from '../../../../components/crm/ModuleListPage';
import { quotationsApi } from '../../../../lib/extensions-api';
import { COMMON_FILTERS, statusOptions, AMOUNT_COLUMN, STATUS_COLUMN, OWNER_COLUMN, NAME_COLUMN } from '../../../../lib/module-configs';
import { Spinner } from '../../../../components/ui/spinner';

function Inner() {
  return (
    <ModuleListPage
      title="Quotations"
      description="Create and track sales quotes"
      entity="quotations"
      columns={[NAME_COLUMN, { key: 'number', label: 'Number' }, STATUS_COLUMN, AMOUNT_COLUMN, OWNER_COLUMN]}
      fetchList={quotationsApi.list}
      createRecord={quotationsApi.create}
      bulkAction={quotationsApi.bulk}
      filters={COMMON_FILTERS}
      filterOptions={{ statuses: statusOptions('quotations') }}
      createDefaults={{ status: 'draft', amount: 0 }}
      createFields={[
        { key: 'title', label: 'Title', required: true },
        { key: 'number', label: 'Quote number' },
        { key: 'amount', label: 'Amount', type: 'number' },
        { key: 'status', label: 'Status', type: 'select', options: statusOptions('quotations') },
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
