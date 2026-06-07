'use client';

import { AreaChart } from '../charts/area-chart';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';

export function SalesChart({ data = [], compact = false }) {
  if (!data.length) {
    return (
      <Card>
        <CardContent className={`flex items-center justify-center text-sm text-muted ${compact ? 'h-48' : 'h-72'}`}>
          No sales data for the last 7 days.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className={compact ? 'pb-2' : undefined}>
        <CardTitle className={compact ? 'text-base' : undefined}>Revenue trend</CardTitle>
        <CardDescription>Won revenue — last 7 days</CardDescription>
      </CardHeader>
      <CardContent className={`flex-1 pb-4 ${compact ? 'h-44' : 'h-64 pb-6'}`}>
        <AreaChart
          labels={data.map((d) => d.label)}
          values={data.map((d) => d.revenue)}
        />
      </CardContent>
    </Card>
  );
}
