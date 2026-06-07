'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootOnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    const tenant = localStorage.getItem('crm_tenant');
    if (tenant) {
      router.replace(`/${tenant}/onboarding`);
      return;
    }
    router.replace('/login');
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center text-muted">
      Redirecting…
    </main>
  );
}
