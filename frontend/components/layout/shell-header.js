import { cn } from '@/lib/utils';

/**
 * Canonical top bar — fixed height across marketing, tenant app, auth, superadmin, onboarding.
 */
export function ShellHeader({ children, className, innerClassName }) {
  return (
    <header
      className={cn(
        'glass-nav sticky top-0 z-30 flex h-[var(--header-height)] shrink-0 items-center border-b border-border',
        className,
      )}
    >
      <div
        className={cn(
          'flex h-full w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8',
          innerClassName,
        )}
      >
        {children}
      </div>
    </header>
  );
}
