import { cn } from '@/lib/utils';

/**
 * Toolbar / topbar icon control — visible in light and dark themes.
 */
export function IconButton({ className, children, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        'icon-btn focus-ring inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-card/85 text-foreground/80 shadow-sm backdrop-blur transition-colors hover:bg-card hover:text-foreground dark:border-border dark:bg-card dark:text-foreground/90 dark:hover:bg-muted',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
