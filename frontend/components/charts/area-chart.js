'use client';

import { Line } from 'react-chartjs-2';
import { registerCharts } from '../../lib/chartjs-setup';
import { useChartColors, chartJsDefaults } from '../../lib/chart-theme';

registerCharts();

export function AreaChart({ labels = [], values = [], label = 'Revenue' }) {
  const colors = useChartColors();

  const data = {
    labels,
    datasets: [
      {
        label,
        data: values,
        borderColor: colors.brand,
        backgroundColor: (ctx) => {
          const { chart } = ctx;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return `${colors.brand}33`;
          const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, `${colors.brand}55`);
          gradient.addColorStop(1, `${colors.brand}00`);
          return gradient;
        },
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: colors.brand,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    ...chartJsDefaults(colors),
    plugins: {
      ...chartJsDefaults(colors).plugins,
      legend: { display: false },
    },
    scales: {
      x: { ...chartJsDefaults(colors).scales.x, grid: { display: false } },
      y: {
        ...chartJsDefaults(colors).scales.y,
        ticks: {
          color: colors.text,
          font: { size: 11 },
          callback: (v) => (v >= 1000 ? `$${v / 1000}k` : `$${v}`),
        },
      },
    },
  };

  return (
    <div className="h-full w-full min-h-[200px]">
      <Line data={data} options={options} />
    </div>
  );
}
