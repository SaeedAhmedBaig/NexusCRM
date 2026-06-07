'use client';

import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const DATA = [
  { m: 1, v: 40 },
  { m: 2, v: 55 },
  { m: 3, v: 48 },
  { m: 4, v: 72 },
  { m: 5, v: 65 },
  { m: 6, v: 88 },
  { m: 7, v: 95 },
];

export function LineChartCta() {
  return (
    <div className="h-[200px] min-h-[200px] w-full">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={DATA}>
          <Area
            type="monotone"
            dataKey="v"
            stroke="var(--chart-1)"
            strokeWidth={2}
            fill="var(--chart-1)"
            fillOpacity={0.08}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
