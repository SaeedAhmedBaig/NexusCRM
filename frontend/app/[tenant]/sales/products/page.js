'use client';

import { Suspense } from 'react';
import { ModuleListPage } from '../../../../components/crm/ModuleListPage';
import { productsApi } from '../../../../lib/extensions-api';
import { COMMON_FILTERS, statusOptions, STATUS_COLUMN, OWNER_COLUMN } from '../../../../lib/module-configs';
import { Spinner } from '../../../../components/ui/spinner';

const PRICE_COLUMN = {
  key: 'unitPrice',
  label: 'Unit price',
  type: 'currency',
};
const PRODUCT_NAME_COLUMN = { key: 'name', label: 'Name', sortKey: 'name' };

function Inner() {
  return (
    <ModuleListPage
      title="Product Catalog"
      description="Manage SKUs, service packages, recurring products, pricing, tax metadata, and quote-to-cash catalog items."
      entity="products"
      columns={[
        PRODUCT_NAME_COLUMN,
        { key: 'sku', label: 'SKU' },
        { key: 'category', label: 'Category' },
        { key: 'type', label: 'Type' },
        STATUS_COLUMN,
        PRICE_COLUMN,
        OWNER_COLUMN,
      ]}
      fetchList={productsApi.list}
      getRecord={productsApi.get}
      createRecord={productsApi.create}
      updateRecord={productsApi.update}
      bulkAction={productsApi.bulk}
      filters={COMMON_FILTERS}
      filterOptions={{ statuses: statusOptions('products') }}
      createDefaults={{ status: 'active', type: 'one_time', unitPrice: 0, currency: 'USD', isTaxable: true }}
      createFields={[
        { key: 'name', label: 'Product name', required: true },
        { key: 'sku', label: 'SKU' },
        { key: 'category', label: 'Category' },
        { key: 'type', label: 'Type', type: 'select', options: [
          { value: 'one_time', label: 'One time' },
          { value: 'recurring', label: 'Recurring' },
          { value: 'service', label: 'Service' },
        ] },
        { key: 'status', label: 'Status', type: 'select', options: statusOptions('products') },
        { key: 'unitPrice', label: 'Unit price', type: 'number' },
        { key: 'cost', label: 'Cost', type: 'number' },
        { key: 'currency', label: 'Currency' },
        { key: 'taxCode', label: 'Tax code' },
        { key: 'billingPeriod', label: 'Billing period', type: 'select', options: [
          { value: 'none', label: 'None' },
          { value: 'monthly', label: 'Monthly' },
          { value: 'quarterly', label: 'Quarterly' },
          { value: 'yearly', label: 'Yearly' },
        ] },
        { key: 'description', label: 'Description', type: 'textarea' },
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
