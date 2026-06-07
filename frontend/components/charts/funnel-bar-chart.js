'use client';

import { Bar } from 'react-chartjs-2';
import { registerCharts } from '../../lib/chartjs-setup';
import { useChartColors, getFunnelStageColor, chartJsDefaults } from '../../lib/chart-theme';

registerCharts();

export function FunnelBarChart({ stages = [] }) {
  const colors = useChartColors();

  const filtered = stages.filter((s) => s.key !== 'lost' || s.count > 0);
  const labels = filtered.map((s) => s.label);
  const counts = filtered.map((s) => s.count);
  const barColors = filtered.map((s, i) => getFunnelStageColor(colors, s.key, i));

  const data = {
    labels,
    datasets: [
      {
        label: 'Deals',
        data: counts,
        backgroundColor: barColors,
        borderRadius: 6,
        borderSkipped: false,
        barThickness: 22,
      },
    ],
  };

  const options = {
    ...chartJsDefaults(colors),
    indexAxis: 'y',
    plugins: {
      ...chartJsDefaults(colors).plugins,
      legend: { display: false },
      tooltip: {
        ...chartJsDefaults(colors).plugins.tooltip,
        callbacks: {
          label: (ctx) => `${ctx.parsed.x} deals`,
        },
      },
    },
    scales: {
      x: {
        ...chartJsDefaults(colors).scales.x,
        grid: { color: colors.funnel.track },
        beginAtZero: true,
        ticks: { stepSize: 1, color: colors.text, font: { size: 11 } },
      },
      y: {
        ...chartJsDefaults(colors).scales.y,
        grid: { display: false },
        ticks: { color: colors.text, font: { size: 12, weight: '500' } },
      },
    },
  };

  if (!filtered.length || counts.every((c) => c === 0)) {
    return (
      <p className="flex h-48 items-center justify-center text-sm text-muted">
        No pipeline data yet. Add deals to see your funnel.
      </p>
    );
  }

  return (
    <div className="h-full w-full min-h-[240px]">
      <Bar data={data} options={options} />
    </div>
  );
}
