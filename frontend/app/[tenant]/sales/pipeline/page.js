'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listDeals, updateDeal } from '../../../../lib/crm-api';
import { useSession } from '../../../../components/providers/session-context';
import { DealPipelineKanban } from '../../../../components/crm/DealPipelineKanban';
import { PageHeader } from '../../../../components/ui/page-header';
import { Spinner } from '../../../../components/ui/spinner';

export default function SalesPipelinePage() {
  const { subdomain } = useSession();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['pipeline-deals'],
    queryFn: () => listDeals({ limit: 200, status: 'open' }),
  });

  const stageMutation = useMutation({
    mutationFn: ({ id, stage }) => updateDeal(id, { stage }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pipeline-deals'] }),
  });

  if (isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales pipeline"
        description="Visual Kanban board — drag deals across stages"
      />
      <DealPipelineKanban
        deals={data?.data || []}
        subdomain={subdomain}
        onStageChange={(id, stage) => stageMutation.mutate({ id, stage })}
      />
    </div>
  );
}
