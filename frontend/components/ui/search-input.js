'use client';

import { Search } from 'lucide-react';
import { cn } from '../../lib/utils';

export function SearchInput({
  className,
  inputClassName,
  placeholder = 'Search…',
  defaultValue,
  value,
  onChange,
  onKeyDown,
  ...props
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-2.5 rounded-full border border-border bg-card/85',
        'px-4 py-0 shadow-sm backdrop-blur transition-colors focus-within:border-foreground/30 focus-within:ring-[3px] focus-within:ring-[var(--ring)]',
        className,
      )}
    >
      <Search
        className="h-4 w-4 shrink-0 text-muted-foreground"
        strokeWidth={2}
        aria-hidden
      />
      <input
        type="text"
        role="search"
        inputMode="search"
        autoComplete="off"
        placeholder={placeholder}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        className={cn(
          'min-w-0 flex-1 border-0 bg-transparent py-2.5 text-sm text-foreground outline-none',
          'placeholder:truncate placeholder:text-muted',
          inputClassName,
        )}
        {...props}
      />
    </div>
  );
}
