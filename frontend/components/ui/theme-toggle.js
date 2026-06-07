'use client';

import { useEffect, useState } from 'react';
import { Check, Moon, Sun } from 'lucide-react';
import { useTheme } from '../providers/theme-provider';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';

const MODES = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
];

const triggerClass =
  'icon-btn focus-ring inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-card text-foreground/80 shadow-sm transition-colors hover:bg-muted hover:text-foreground';

export function ThemeToggle({ compact = true }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button type="button" className={cn(triggerClass, 'opacity-0')} aria-hidden disabled>
        <Sun className="size-4" />
      </button>
    );
  }

  const current = theme === 'dark' || theme === 'light' ? theme : resolvedTheme || 'light';
  const active = MODES.find((m) => m.value === current) || MODES[0];
  const ActiveIcon = active.icon;

  if (!compact) {
    return (
      <div className="flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5 shadow-sm">
        {MODES.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors ${
              current === value
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-label={label}
            aria-pressed={current === value}
          >
            <Icon className="size-3.5" strokeWidth={1.75} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={triggerClass}
        aria-label={`Theme: ${active.label}. Click to change.`}
      >
        <ActiveIcon className="size-4" strokeWidth={1.75} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        {MODES.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem key={value} onClick={() => setTheme(value)} className="gap-2">
            <Icon className="size-4" strokeWidth={1.75} />
            <span className="flex-1">{label}</span>
            {current === value && <Check className="size-4 text-foreground" strokeWidth={2} />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
