'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const SEGMENTS = [
  { name: 'Direct Sale', value: 35, fill: 'var(--chart-1)', swatch: 'bg-chart-1' },
  { name: 'Total Revenue', value: 28, fill: 'var(--chart-2)', swatch: 'bg-chart-2' },
  { name: 'Referral', value: 22, fill: 'var(--chart-3)', swatch: 'bg-chart-3' },
  { name: 'Email Campaign', value: 15, fill: 'var(--chart-5)', swatch: 'bg-chart-5' },
];

export function DonutChart({ centerLabel = 'Pipeline mix' }) {
  return (
    <div>
      <div className="relative h-[200px] min-h-[200px] w-full">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={SEGMENTS}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={2}
              dataKey="value"
              isAnimationActive={false}
            >
              {SEGMENTS.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs text-muted-foreground">{centerLabel}</span>
          <span className="text-lg font-semibold text-foreground">100%</span>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {SEGMENTS.map((s) => (
          <div key={s.name} className="flex items-center gap-2 text-xs">
            <span className={`size-2.5 shrink-0 rounded-sm ${s.swatch}`} />
            <span className="text-muted-foreground">{s.name}</span>
            <span className="ml-auto font-medium text-foreground">{s.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
