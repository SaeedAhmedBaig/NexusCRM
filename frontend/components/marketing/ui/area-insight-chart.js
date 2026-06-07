'use client';

import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const TREND_DATA = [
  { i: 0, value: 1200 },
  { i: 1, value: 1800 },
  { i: 2, value: 1500 },
  { i: 3, value: 2200 },
  { i: 4, value: 1900 },
  { i: 5, value: 2500 },
  { i: 6, value: 2100 },
];

export function AreaInsightChart() {
  return (
    <div className="relative h-[200px] min-h-[200px] w-full">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={TREND_DATA}>
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--chart-1)"
            strokeWidth={2}
            fill="var(--chart-1)"
            fillOpacity={0.08}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
