import Link from 'next/link';
import { Button as ShadcnButton, buttonVariants } from './button.jsx';
import { cn } from '@/lib/utils';

const VARIANT_MAP = {
  primary: 'default',
  secondary: 'secondary',
  ghost: 'ghost',
  outline: 'outline',
  danger: 'destructive',
};

const SIZE_MAP = {
  sm: 'sm',
  md: 'default',
  lg: 'lg',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  className = '',
  ...props
}) {
  const mappedVariant = VARIANT_MAP[variant] || variant;
  const mappedSize = SIZE_MAP[size] || size;
  const classes = cn(buttonVariants({ variant: mappedVariant, size: mappedSize }), className);

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <ShadcnButton variant={mappedVariant} size={mappedSize} className={className} {...props}>
      {children}
    </ShadcnButton>
  );
}

export { buttonVariants };
