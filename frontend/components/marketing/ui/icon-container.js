import { cn } from '@/lib/utils';

const VARIANTS = {
  primary: 'bg-muted text-foreground',
  blue: 'bg-muted text-foreground',
  green: 'bg-muted text-foreground',
};

const SIZES = {
  32: 'size-8',
  40: 'size-10',
  48: 'size-12',
};

export function IconContainer({ variant = 'primary', children, size = 48, className = '' }) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-md',
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || 'size-12',
        className,
      )}
    >
      {children}
    </div>
  );
}
