'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, RefreshCw } from 'lucide-react';
import { FormField, inputClass } from '../ui/form-field';
import { Button } from '../ui/button';
import { resendVerification, verifyOtp, verifyEmail, setSession } from '../../lib/api';
import { getTenantUrl } from '../../lib/tenant';
import { notifyError, notifySuccess } from '../../lib/notify';

const OTP_LENGTH = 6;

export function VerifyEmailForm({ email: initialEmail, token, subdomain, tenantName }) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail || '');
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  useEffect(() => {
    if (token) {
      handleTokenVerify(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleTokenVerify(t) {
    setLoading(true);
    setError('');
    try {
      const result = await verifyEmail(t);
      finishVerification(result);
    } catch (err) {
      setError(err.message || 'Verification link expired. Enter the code from your email.');
    } finally {
      setLoading(false);
    }
  }

  function finishVerification(result) {
    if (result.token) {
      setSession({ token: result.token, tenant: result.tenant, rules: result.rules });
      notifySuccess('Email verified — welcome to NexusCRM');
      const target = result.tenant?.onboardingCompleted === false ? '/onboarding' : '/dashboard';
      router.push(getTenantUrl(result.tenant.subdomain, target));
      return;
    }
    notifySuccess('Email verified');
    router.push('/login');
  }

  function handleDigitChange(index, value) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((d, i) => { next[i] = d; });
    setDigits(next);
    inputsRef.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const otp = digits.join('');
    if (otp.length !== OTP_LENGTH) {
      setError('Enter the full 6-digit code');
      return;
    }
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await verifyOtp({ email: email.trim(), otp });
      finishVerification(result);
    } catch (err) {
      setError(err.message);
      notifyError(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email.trim() || cooldown > 0) return;
    setResending(true);
    setError('');
    try {
      await resendVerification(email.trim());
      setCooldown(60);
      notifySuccess('Verification code sent');
    } catch (err) {
      setError(err.message);
      notifyError(err);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-subtle text-brand">
          <Mail className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">Check your inbox</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {tenantName ? (
              <>We sent a 6-digit code to verify <strong className="text-foreground">{tenantName}</strong>.</>
            ) : (
              <>Enter the 6-digit code we sent to your email.</>
            )}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {!initialEmail && (
          <FormField label="Email address">
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
          </FormField>
        )}

        {initialEmail && (
          <p className="text-sm text-muted-foreground">
            Code sent to <span className="font-medium text-foreground">{email}</span>
          </p>
        )}

        <div>
          <p className="mb-3 text-sm font-medium text-foreground">Verification code</p>
          <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputsRef.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="h-12 w-10 rounded-lg border border-border bg-card text-center text-lg font-semibold tabular-nums text-foreground outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/20 sm:h-14 sm:w-12"
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">Expires in 15 minutes</p>
        </div>

        {error && (
          <p className="rounded-lg border border-danger/20 bg-danger-light px-4 py-2.5 text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Verifying…' : 'Verify & continue'}
        </Button>
      </form>

      <div className="flex flex-col items-center gap-2 text-sm">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || cooldown > 0 || !email.trim()}
          className="inline-flex items-center gap-1.5 font-medium text-brand hover:text-brand-dark disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${resending ? 'animate-spin' : ''}`} />
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
        <Link href="/login" className="text-muted-foreground hover:text-foreground">
          ← Back to sign in
        </Link>
      </div>
    </div>
  );
}
