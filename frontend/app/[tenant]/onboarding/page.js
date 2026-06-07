'use client';

import { OnboardingWizard } from '../../../components/onboarding/onboarding-wizard';
import { useSession } from '../../../components/providers/session-context';

export default function OnboardingPage() {
  const { subdomain } = useSession();

  return (
    <div className="animate-fade-in">
      <div className="mb-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand">Welcome to NexusCRM</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Let&apos;s set up your workspace
        </h1>
        <p className="mx-auto mt-2 max-w-md text-muted">
          This takes about 2 minutes. You can change everything later in Settings.
        </p>
      </div>
      <OnboardingWizard subdomain={subdomain} />
    </div>
  );
}
