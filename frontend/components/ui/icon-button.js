import { cn } from '@/lib/utils';

/**
 * Toolbar / topbar icon control — visible in light and dark themes.
 */
export function IconButton({ className, children, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        'icon-btn focus-ring inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-control text-foreground/80 shadow-sm transition-colors hover:bg-control-hover hover:text-foreground dark:text-foreground/90',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
