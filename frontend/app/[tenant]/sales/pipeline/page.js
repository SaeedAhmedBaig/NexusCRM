'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listDealPipelines, listDeals, updateDeal } from '../../../../lib/crm-api';
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

  const { data: pipelines = [] } = useQuery({
    queryKey: ['deal-pipelines'],
    queryFn: listDealPipelines,
    staleTime: 120_000,
  });

  const pipeline = pipelines.find((item) => item.isDefault) || pipelines[0];

  const stageMutation = useMutation({
    mutationFn: ({ id, stageKey, stage }) => updateDeal(id, {
      pipelineId: pipeline?.id,
      stageKey,
      stage: stageKey,
      status: stage?.isWon ? 'won' : stage?.isLost ? 'lost' : 'open',
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pipeline-deals'] }),
  });

  if (isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales pipeline"
        description={pipeline ? `Visual Kanban board for ${pipeline.name}` : 'Visual Kanban board — drag deals across stages'}
      />
      <DealPipelineKanban
        deals={data?.data || []}
        stages={pipeline?.stages}
        subdomain={subdomain}
        onStageChange={(id, stageKey, stage) => stageMutation.mutate({ id, stageKey, stage })}
      />
    </div>
  );
}
