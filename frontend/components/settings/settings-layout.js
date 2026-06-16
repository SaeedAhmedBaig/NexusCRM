'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export function SettingsPageShell({ title, description, actions, children, className = '' }) {
  return (
    <div className={cn('mx-auto max-w-6xl animate-fade-in space-y-5', className)}>
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">{title}</h1>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function SettingsSection({ title, description, actions, children, className = '' }) {
  return (
    <section className={cn('border border-border bg-card', className)}>
      <div className="flex flex-col gap-2 border-b border-border bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

export function SettingsRow({ icon: Icon, label, description, value, href, action, children, className = '' }) {
  const content = (
    <div className={cn('grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center', className)}>
      <div className="flex min-w-0 gap-3">
        {Icon ? (
          <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center border border-border bg-control text-muted-foreground">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {description ? <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p> : null}
          {children ? <div className="mt-3">{children}</div> : null}
        </div>
      </div>
      <div className="flex items-center justify-end gap-3">
        {value !== undefined ? <span className="text-sm font-medium text-muted-foreground">{value}</span> : null}
        {action}
        {href ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : null}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block transition-colors hover:bg-muted/50">
        {content}
      </Link>
    );
  }

  return content;
}

export function SettingsButton({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={cn('inline-flex h-8 items-center gap-2 border border-border bg-control px-3 text-xs font-semibold text-foreground hover:bg-control-hover disabled:opacity-50', className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function SettingsPrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={cn('inline-flex h-8 items-center gap-2 bg-brand px-3 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-50', className)}
      {...props}
    >
      {children}
    </button>
  );
}
