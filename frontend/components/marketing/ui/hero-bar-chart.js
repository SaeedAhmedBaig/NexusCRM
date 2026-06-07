'use client';

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const DATA = [
  { month: 'Jan', value: 4200 },
  { month: 'Feb', value: 5800 },
  { month: 'Mar', value: 4900 },
  { month: 'Apr', value: 7200 },
  { month: 'May', value: 6100 },
  { month: 'Jun', value: 8900 },
  { month: 'Jul', value: 7400 },
];

const ACTIVE_INDEX = 5;

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground shadow-sm">
      <p className="font-medium">{label}</p>
      <p className="text-muted-foreground">{payload[0].value?.toLocaleString()}</p>
    </div>
  );
}

export function HeroBarChart() {
  return (
    <div className="h-[200px] min-h-[200px] w-full">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={DATA} barSize={10}>
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: 'var(--chart-text)' }}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'transparent' }} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {DATA.map((_, index) => (
              <Cell
                key={index}
                fill={index === ACTIVE_INDEX ? 'var(--chart-1)' : 'var(--chart-5)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
