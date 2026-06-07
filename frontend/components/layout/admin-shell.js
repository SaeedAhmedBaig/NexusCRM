'use client';

import { Logo } from '../marketing/logo';
import { ThemeToggle } from '../ui/theme-toggle';
import { PageHeader } from '../ui/page-header';

export function AdminShell({ title, description, badge, actions, children }) {
  return (
    <div className="auth-pattern flex min-h-screen flex-col">
      <header className="glass-nav flex items-center justify-between px-4 py-4 sm:px-8">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {actions}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8">
        <PageHeader title={title} description={description} badge={badge} />
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}
