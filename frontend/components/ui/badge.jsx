import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 text-xs font-medium capitalize whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background [a]:hover:bg-foreground/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const LEGACY_VARIANT_MAP = {
  default: 'outline',
  brand: 'default',
  success: 'secondary',
  warning: 'outline',
  danger: 'destructive',
  info: 'outline',
  muted: 'ghost',
};

function Badge({
  className,
  variant = "default",
  render,
  ...props
}) {
  const mappedVariant = LEGACY_VARIANT_MAP[variant] || variant;
  return useRender({
    defaultTagName: "span",
    props: mergeProps({
      className: cn(
        badgeVariants({ variant: mappedVariant }),
        mappedVariant === 'default' && variant === 'brand' && 'bg-muted text-foreground border-border',
        className,
      ),
    }, props),
    render,
    state: {
      slot: "badge",
      variant: mappedVariant,
    },
  });
}

const STATUS_VARIANT_MAP = {
  open: 'default',
  won: 'secondary',
  lost: 'destructive',
  pending: 'outline',
  approved: 'secondary',
  rejected: 'destructive',
  active: 'secondary',
  trial: 'outline',
  suspended: 'destructive',
  inactive: 'outline',
  prospect: 'default',
  new: 'default',
  contacted: 'outline',
  qualified: 'secondary',
  todo: 'outline',
  in_progress: 'outline',
  done: 'secondary',
  lead: 'default',
  proposal: 'default',
  negotiation: 'outline',
};

function StatusBadge({ status }) {
  const variant = STATUS_VARIANT_MAP[status] || 'ghost';
  return <Badge variant={variant}>{status?.replace(/_/g, ' ') || '—'}</Badge>;
}

export { Badge, badgeVariants, StatusBadge };
