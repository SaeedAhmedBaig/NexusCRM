'use client';

import { Bar } from 'react-chartjs-2';
import { registerCharts } from '../../lib/chartjs-setup';
import { useChartColors, chartJsDefaults } from '../../lib/chart-theme';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';

registerCharts();

export function TeamPerformanceChart({ data = [], compact = false }) {
  const colors = useChartColors();

  const chartData = {
    labels: data.map((d) => d.name),
    datasets: [
      {
        label: 'Revenue',
        data: data.map((d) => d.revenue),
        backgroundColor: colors.brand,
        borderRadius: 6,
      },
      {
        label: 'Conversion %',
        data: data.map((d) => d.conversionRate),
        backgroundColor: colors.palette[2],
        borderRadius: 6,
      },
    ],
  };

  const options = {
    ...chartJsDefaults(colors),
    plugins: { ...chartJsDefaults(colors).plugins, legend: { position: 'bottom' } },
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className={compact ? 'pb-2' : undefined}>
        <CardTitle className={compact ? 'text-base' : undefined}>Team performance</CardTitle>
        <CardDescription>Revenue and conversion by sales rep</CardDescription>
      </CardHeader>
      <CardContent className={`flex-1 ${compact ? 'min-h-[180px]' : 'min-h-[260px]'}`}>
        {data.length ? (
          <Bar data={chartData} options={options} />
        ) : (
          <p className="flex h-48 items-center justify-center text-sm text-muted">No team data yet</p>
        )}
      </CardContent>
    </Card>
  );
}
