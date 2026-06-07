import Link from 'next/link';

export function LogoMark({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden
    >
      <rect x="4" y="8" width="14" height="18" rx="4" className="fill-brand opacity-90" />
      <rect x="14" y="4" width="14" height="18" rx="4" className="fill-brand" />
    </svg>
  );
}

export function Logo({ className = '' }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={28} />
      <span className="text-base font-semibold tracking-tight text-foreground">
        Nexus<span className="text-muted-foreground">CRM</span>
      </span>
    </Link>
  );
}
