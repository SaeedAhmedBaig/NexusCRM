'use client';

import { Line } from 'react-chartjs-2';
import { registerCharts } from '../../lib/chartjs-setup';
import { useChartColors, chartJsDefaults } from '../../lib/chart-theme';

registerCharts();

export function LineChartPanel({ labels = [], datasets = [], height = 320 }) {
  const colors = useChartColors();

  const data = {
    labels,
    datasets: datasets.map((ds, i) => ({
      tension: 0.3,
      pointRadius: 0,
      borderWidth: ds.borderWidth ?? (i === 0 ? 2 : 1.5),
      ...ds,
      borderColor: ds.borderColor || colors.palette[i % colors.palette.length],
    })),
  };

  const options = {
    ...chartJsDefaults(colors),
    scales: {
      x: { ...chartJsDefaults(colors).scales.x, grid: { display: false } },
      y: { ...chartJsDefaults(colors).scales.y, beginAtZero: true },
    },
  };

  return (
    <div style={{ height }} className="w-full">
      <Line data={data} options={options} />
    </div>
  );
}
