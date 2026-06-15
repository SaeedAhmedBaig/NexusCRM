'use client';

import { Children } from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { CheckSquare, Clock3, GripVertical, MessageCircle, Paperclip, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Shared enterprise Kanban card — used by tasks, deals, projects */
export function KanbanCard({
  id,
  title,
  subtitle,
  meta,
  badges = [],
  labels = [],
  coverClassName,
  dueDate,
  assignees = [],
  checklist,
  commentCount,
  attachmentCount,
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
    <div className="space-y-3">
      {coverClassName && <div className={cn('h-2 rounded-full', coverClassName)} />}
      {labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {labels.map((label) => (
            <span
              key={label.label || label}
              className={cn('h-2 min-w-8 rounded-full', label.className || label)}
              title={label.label || label}
            />
          ))}
        </div>
      )}
      <div className="flex items-start gap-2.5">
      <button
        type="button"
        className="mt-0.5 shrink-0 cursor-grab rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Drag"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" strokeWidth={1.75} />
      </button>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">{title}</p>
        {subtitle && <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">{subtitle}</p>}
        {meta && <p className="mt-1 text-[11px] text-muted-foreground">{meta}</p>}
        {badges.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {badges.map((b) => (
              <span
                key={b.label}
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                  b.className || 'bg-muted text-muted-foreground',
                )}
              >
                {b.label}
              </span>
            ))}
          </div>
        )}
      </div>
      </div>
      {(dueDate || assignees.length > 0 || checklist || commentCount || attachmentCount) && (
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          {dueDate && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
              <Clock3 className="h-3 w-3" />
              {new Date(dueDate).toLocaleDateString()}
            </span>
          )}
          {checklist && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
              <CheckSquare className="h-3 w-3" />
              {checklist.done}/{checklist.total}
            </span>
          )}
          {commentCount ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
              <MessageCircle className="h-3 w-3" />
              {commentCount}
            </span>
          ) : null}
          {attachmentCount ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
              <Paperclip className="h-3 w-3" />
              {attachmentCount}
            </span>
          ) : null}
          {assignees.length > 0 && (
            <span className="ml-auto inline-flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span className="flex -space-x-1.5">
                {assignees.slice(0, 3).map((user) => (
                  <span
                    key={user.id || user.userId || user.email || user.name}
                    className="flex size-6 items-center justify-center rounded-full border border-card bg-foreground text-[10px] font-semibold text-background"
                    title={user.name || user.email}
                  >
                    {(user.name || user.email || '?').charAt(0).toUpperCase()}
                  </span>
                ))}
              </span>
            </span>
          )}
        </div>
      )}
      {footer}
    </div>
  );

  const shell = cn(
    'rounded-[1.35rem] border border-border bg-card p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
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
    'rounded-[1.35rem] border border-border bg-card p-3.5 shadow-sm transition-shadow hover:shadow-md',
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

export function KanbanColumn({ id, title, count, summary, accent, children, empty }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const hasChildren = Children.count(children) > 0;

  return (
    <div className="flex min-w-[292px] flex-1 flex-col">
      <div className="mb-3 flex items-center justify-between px-1">
        <div>
          <div className="flex items-center gap-2">
            <span className={cn('h-2.5 w-2.5 rounded-full', accent)} />
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {count}
            {summary ? ` · ${summary}` : ''}
          </p>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-[360px] flex-1 flex-col gap-3 rounded-[1.75rem] border border-border bg-surface p-3 transition-colors',
          isOver && 'bg-muted ring-2 ring-brand/20',
        )}
      >
        {hasChildren ? children : (
          <div className="flex min-h-32 items-center justify-center rounded-[1.25rem] border border-dashed border-border bg-card/60 p-4 text-center text-xs text-muted-foreground">
            {empty || 'Drop cards here'}
          </div>
        )}
      </div>
    </div>
  );
}
