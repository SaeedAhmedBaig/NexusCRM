'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthShell } from '../../../components/layout/auth-shell';
import { VerifyEmailForm } from '../../../components/auth/verify-email-form';
import { Spinner } from '../../../components/ui/spinner';

function VerifyContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';
  const subdomain = searchParams.get('subdomain') || '';
  const tenantName = searchParams.get('tenant') || '';

  return (
    <VerifyEmailForm
      email={email}
      token={token}
      subdomain={subdomain}
      tenantName={tenantName}
    />
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthShell
      badge="Email verification"
      title="Verify your email"
      subtitle="Enter the 6-digit code we sent to your inbox"
    >
      <Suspense fallback={<div className="flex justify-center py-8"><Spinner /></div>}>
        <VerifyContent />
      </Suspense>
    </AuthShell>
  );
}
