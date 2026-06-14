'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

export function KpiCard({ label, value, hint, icon: Icon, trend, trendLabel }) {
  const trendUp = trend > 0;
  const trendDown = trend < 0;
  const TrendIcon = trendUp ? TrendingUp : trendDown ? TrendingDown : Minus;

  return (
    <Card className="border-white/70 bg-card/85 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground tabular-nums">{value}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {trend != null && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-[11px] font-medium',
                    trendUp && 'text-success',
                    trendDown && 'text-danger',
                    !trendUp && !trendDown && 'text-muted-foreground',
                  )}
                >
                  <TrendIcon className="h-3 w-3" strokeWidth={2} />
                  {trend > 0 ? '+' : ''}
                  {trend}%
                  {trendLabel && <span className="font-normal text-muted-foreground">{trendLabel}</span>}
                </span>
              )}
              {hint && trend == null && <p className="text-[11px] text-muted-foreground">{hint}</p>}
            </div>
          </div>
          {Icon && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
