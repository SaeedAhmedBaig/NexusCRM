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
        'flex min-w-0 items-center gap-3 rounded-md border border-border bg-control',
        'min-h-10 px-3.5 py-0 shadow-sm transition-colors focus-within:border-brand focus-within:ring-[3px] focus-within:ring-[var(--ring)]',
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
          'min-w-0 flex-1 border-0 bg-transparent py-3 text-sm text-foreground outline-none',
          'placeholder:truncate placeholder:text-muted-foreground',
          inputClassName,
        )}
        {...props}
      />
    </div>
  );
}
