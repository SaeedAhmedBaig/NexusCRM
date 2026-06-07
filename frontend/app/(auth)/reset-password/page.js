'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { AuthShell } from '../../../components/layout/auth-shell';
import { FormField, inputClass, inputErrorClass } from '../../../components/ui/form-field';
import { Button } from '../../../components/ui/button';
import { resetPassword } from '../../../lib/api';
import { Spinner } from '../../../components/ui/spinner';

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await resetPassword({ token, password });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <p className="rounded-lg border border-danger/20 bg-danger-light px-4 py-3 text-sm text-danger">
        Invalid or missing reset link. Request a new one from the forgot password page.
      </p>
    );
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-light text-success">
          <CheckCircle2 className="h-7 w-7" strokeWidth={1.75} />
        </span>
        <p className="text-sm text-muted-foreground">Your password has been updated. You can sign in with your new password.</p>
        <Link href="/login" className="inline-block text-sm font-semibold text-brand hover:text-brand-dark">
          Sign in →
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="New password" hint="At least 8 characters">
        <input
          required
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className={inputClass}
          autoComplete="new-password"
        />
      </FormField>
      <FormField label="Confirm password" error={error && password !== confirm ? 'Passwords do not match' : undefined}>
        <input
          required
          type="password"
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          className={`${inputClass} ${error && password !== confirm ? inputErrorClass : ''}`}
          autoComplete="new-password"
        />
      </FormField>
      {error && (
        <p className="rounded-lg border border-danger/20 bg-danger-light px-4 py-2.5 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Updating…' : 'Update password'}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      badge="Security"
      title="Set a new password"
      subtitle="Choose a strong password for your account"
    >
      <Suspense fallback={<div className="flex justify-center py-8"><Spinner /></div>}>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
