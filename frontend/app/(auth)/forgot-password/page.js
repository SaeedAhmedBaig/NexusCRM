'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MailCheck } from 'lucide-react';
import { AuthShell } from '../../../components/layout/auth-shell';
import { FormField, inputClass } from '../../../components/ui/form-field';
import { Button } from '../../../components/ui/button';
import { forgotPassword } from '../../../lib/api';
import { notifySuccess } from '../../../lib/notify';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
      notifySuccess('Reset link sent if account exists');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      badge="Account recovery"
      title="Forgot password?"
      subtitle="We'll email you a secure link to reset your password"
    >
      {sent ? (
        <div className="space-y-4 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-light text-success">
            <MailCheck className="h-7 w-7" strokeWidth={1.75} />
          </span>
          <p className="text-sm text-muted-foreground">
            If an account exists for <strong className="text-foreground">{email}</strong>, you will receive a password reset link shortly. Check spam if you do not see it.
          </p>
          <Link href="/login" className="inline-block text-sm font-semibold text-brand hover:text-brand-dark">
            ← Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Email address">
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className={inputClass}
              autoComplete="email"
            />
          </FormField>
          {error && (
            <p className="rounded-lg border border-danger/20 bg-danger-light px-4 py-2.5 text-sm text-danger" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sending…' : 'Send reset link'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-semibold text-brand hover:text-brand-dark">
              ← Back to sign in
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
