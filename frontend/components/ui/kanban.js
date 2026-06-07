'use client';

import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Shared enterprise Kanban card — used by tasks, deals, projects */
export function KanbanCard({
  id,
  title,
  subtitle,
  meta,
  badges = [],
  footer,
  onClick,
  href,
  isDragging,
  className,
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.45 : 1,
  };

  const body = (
    <div className="flex items-start gap-2">
      <button
        type="button"
        className="mt-0.5 shrink-0 cursor-grab text-muted-foreground hover:text-foreground"
        aria-label="Drag"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" strokeWidth={1.75} />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-foreground">{title}</p>
        {subtitle && <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">{subtitle}</p>}
        {meta && <p className="mt-1 text-[11px] text-muted-foreground">{meta}</p>}
        {badges.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {badges.map((b) => (
              <span
                key={b.label}
                className={cn(
                  'rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                  b.className || 'bg-muted text-muted-foreground',
                )}
              >
                {b.label}
              </span>
            ))}
          </div>
        )}
        {footer}
      </div>
    </div>
  );

  const shell = cn(
    'rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md',
    className,
  );

  if (href) {
    return (
      <a ref={setNodeRef} style={style} href={href} className={cn(shell, 'block no-underline')}>
        {body}
      </a>
    );
  }

  if (onClick) {
    return (
      <div ref={setNodeRef} style={style} className={shell}>
        <button type="button" className="w-full text-left" onClick={onClick}>
          {body}
        </button>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className={shell}>
      {body}
    </div>
  );
}

/** Static card shell — same look as KanbanCard without drag (projects grid, etc.) */
export function KanbanStaticCard({ title, subtitle, meta, badges = [], footer, href, className }) {
  const body = (
    <div className="min-w-0 flex-1">
      <p className="truncate text-[13px] font-medium text-foreground">{title}</p>
      {subtitle && <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">{subtitle}</p>}
      {meta && <p className="mt-1 text-[11px] text-muted-foreground">{meta}</p>}
      {badges.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {badges.map((b) => (
            <span
              key={b.label}
              className={cn(
                'rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                b.className || 'bg-muted text-muted-foreground',
              )}
            >
              {b.label}
            </span>
          ))}
        </div>
      )}
      {footer}
    </div>
  );

  const shell = cn(
    'rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md',
    className,
  );

  if (href) {
    return (
      <a href={href} className={cn(shell, 'block no-underline')}>
        {body}
      </a>
    );
  }

  return <div className={shell}>{body}</div>;
}

export function KanbanColumn({ id, title, count, summary, accent, children }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex min-w-[248px] flex-1 flex-col">
      <div className={cn('mb-2 border-t-2 px-1 pt-2', accent)}>
        <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
        <p className="text-[11px] text-muted-foreground">
          {count}
          {summary ? ` · ${summary}` : ''}
        </p>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-[220px] flex-1 flex-col gap-2 rounded-lg border border-border/60 bg-muted/30 p-2 transition-colors',
          isOver && 'bg-muted ring-1 ring-foreground/10',
        )}
      >
        {children}
      </div>
    </div>
  );
}
