import { Logo } from '../marketing/logo';
import { ThemeToggle } from '../ui/theme-toggle';
import { ShellHeader } from './shell-header';

export function OnboardingShell({ children }) {
  return (
    <div className="min-h-screen bg-surface-elevated">
      <ShellHeader>
        <Logo />
        <ThemeToggle />
      </ShellHeader>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">{children}</div>
    </div>
  );
}
