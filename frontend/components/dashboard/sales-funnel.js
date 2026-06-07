'use client';

import { FunnelBarChart } from '../charts/funnel-bar-chart';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';

const DEFAULT_STAGES = [
  { key: 'lead', label: 'Lead', count: 0, revenue: 0 },
  { key: 'qualified', label: 'Qualified', count: 0, revenue: 0 },
  { key: 'proposal', label: 'Proposal', count: 0, revenue: 0 },
  { key: 'negotiation', label: 'Negotiation', count: 0, revenue: 0 },
  { key: 'won', label: 'Won', count: 0, revenue: 0 },
  { key: 'lost', label: 'Lost', count: 0, revenue: 0 },
];

export function SalesFunnel({ stages = DEFAULT_STAGES, title = 'Sales funnel', subtitle = 'Pipeline conversion by stage', compact = false }) {
  const total = stages.reduce((sum, s) => sum + s.count, 0);
  const wonCount = stages.find((s) => s.key === 'won')?.count || 0;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className={compact ? 'pb-2' : undefined}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className={compact ? 'text-base' : undefined}>{title}</CardTitle>
            <CardDescription>{subtitle}</CardDescription>
          </div>
          {total > 0 && (
            <div className="text-right">
              <p className="text-2xl font-semibold tabular-nums text-foreground">{total}</p>
              <p className="text-meta">in pipeline</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className={`flex-1 ${compact ? 'min-h-[180px]' : 'min-h-[280px]'}`}>
        <FunnelBarChart stages={stages} />
      </CardContent>
      <CardFooter className="justify-between text-sm">
        <span className="text-muted">Pipeline health</span>
        <span className="font-medium text-foreground">
          <span className="text-success">{wonCount}</span>
          <span className="text-muted"> won · </span>
          {total} total
        </span>
      </CardFooter>
    </Card>
  );
}
