'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';

function formatCurrency(value) {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export function PipelineGauge({ value = 0, max = 0, compact = false }) {
  const target = max > 0 ? max : value;
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className={compact ? 'pb-2' : undefined}>
        <CardTitle className={compact ? 'text-base' : undefined}>Pipeline value</CardTitle>
        <CardDescription>Total open deal value</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="relative">
          <svg width="140" height="140" className="-rotate-90">
            <circle cx="70" cy="70" r="54" fill="none" stroke="var(--surface)" strokeWidth="12" />
            <circle
              cx="70"
              cy="70"
              r="54"
              fill="none"
              stroke="var(--brand)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tabular-nums text-foreground">{pct}%</span>
            <span className="text-xs text-muted">of target</span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold tabular-nums text-foreground">{formatCurrency(value)}</p>
          <p className="text-sm text-muted">
            Open pipeline{target > 0 ? ` · target ${formatCurrency(target)}` : ''}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
