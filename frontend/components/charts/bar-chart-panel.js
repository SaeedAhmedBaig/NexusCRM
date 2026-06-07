'use client';

import { Bar } from 'react-chartjs-2';
import { registerCharts } from '../../lib/chartjs-setup';
import { useChartColors, chartJsDefaults } from '../../lib/chart-theme';

registerCharts();

export function BarChartPanel({
  labels = [],
  datasets = [],
  horizontal = false,
  height = 320,
}) {
  const colors = useChartColors();

  const data = {
    labels,
    datasets: datasets.map((ds, i) => ({
      ...ds,
      backgroundColor: ds.backgroundColor || colors.palette[i % colors.palette.length],
      borderRadius: horizontal ? { topRight: 4, bottomRight: 4 } : { topLeft: 4, topRight: 4 },
      borderSkipped: false,
    })),
  };

  const base = chartJsDefaults(colors);
  const options = {
    ...base,
    indexAxis: horizontal ? 'y' : 'x',
    scales: horizontal
      ? {
          x: { ...base.scales.x, beginAtZero: true },
          y: { ...base.scales.y, grid: { display: false } },
        }
      : {
          x: { ...base.scales.x, grid: { display: false } },
          y: { ...base.scales.y, beginAtZero: true },
        },
  };

  return (
    <div style={{ height }} className="w-full">
      <Bar data={data} options={options} />
    </div>
  );
}
