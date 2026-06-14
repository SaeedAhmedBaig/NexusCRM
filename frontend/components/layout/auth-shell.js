'use client';

import Link from 'next/link';
import { Logo } from '../marketing/logo';
import { ThemeToggle } from '../ui/theme-toggle';
import { ShellHeader } from './shell-header';

export function AuthShell({ children, title, subtitle, badge }) {
  return (
    <div className="auth-pattern flex min-h-screen flex-col bg-background">
      <ShellHeader>
        <Logo />
        <ThemeToggle />
      </ShellHeader>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:py-14">
        <div className="animate-fade-in w-full max-w-[440px]">
          <div className="rounded-[2rem] border border-border bg-card p-8 shadow-lg sm:p-10">
            {(badge || title) && (
              <div className="mb-8 text-center">
                {badge && (
                  <span className="inline-block rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    {badge}
                  </span>
                )}
                {title && (
                  <h1 className={`text-2xl font-semibold tracking-tight text-foreground ${badge ? 'mt-3' : ''}`}>
                    {title}
                  </h1>
                )}
                {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
              </div>
            )}
            {children}
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            <Link href="/" className="font-medium text-foreground hover:underline">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
