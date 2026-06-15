'use client';

import { Suspense } from 'react';
import { ModuleListPage } from '../../../../components/crm/ModuleListPage';
import { knowledgeApi } from '../../../../lib/extensions-api';
import { COMMON_FILTERS, statusOptions, STATUS_COLUMN, NAME_COLUMN } from '../../../../lib/module-configs';
import { Spinner } from '../../../../components/ui/spinner';

function Inner() {
  return (
    <ModuleListPage
      title="Knowledge base"
      description="Help articles for your team and customers"
      entity="knowledge"
      columns={[NAME_COLUMN, { key: 'category', label: 'Category' }, STATUS_COLUMN]}
      fetchList={knowledgeApi.list}
      getRecord={knowledgeApi.get}
      createRecord={knowledgeApi.create}
      updateRecord={knowledgeApi.update}
      bulkAction={knowledgeApi.bulk}
      filters={COMMON_FILTERS}
      filterOptions={{ statuses: statusOptions('knowledge') }}
      createDefaults={{ status: 'draft', category: 'general' }}
      createFields={[
        { key: 'title', label: 'Title', required: true },
        { key: 'category', label: 'Category' },
        { key: 'content', label: 'Content', type: 'textarea' },
        { key: 'status', label: 'Status', type: 'select', options: statusOptions('knowledge') },
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
