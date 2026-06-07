'use client';

import { useForm } from 'react-hook-form';
import { useState } from 'react';
import Link from 'next/link';
import { FormField, inputClass, inputErrorClass } from '../ui/form-field';
import { notifyError } from '../../lib/notify';

export function LoginForm({ tenantSubdomain, onSubmit, onDiscover }) {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
      subdomain: tenantSubdomain || '',
    },
  });

  async function submit(data) {
    setLoading(true);
    setServerError('');
    try {
      if (onDiscover) {
        await onDiscover(data);
      } else {
        await onSubmit(data);
      }
    } catch (err) {
      setServerError(err.message);
      notifyError(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
      {!tenantSubdomain && (
        <FormField label="Workspace subdomain" error={errors.subdomain?.message}>
          <input
            className={`${inputClass} ${errors.subdomain ? inputErrorClass : ''}`}
            placeholder="yourteam"
            {...register('subdomain', {
              required: onDiscover ? false : 'Subdomain is required',
            })}
          />
        </FormField>
      )}

      <FormField label="Email" error={errors.email?.message}>
        <input
          type="email"
          autoComplete="email"
          className={`${inputClass} ${errors.email ? inputErrorClass : ''}`}
          placeholder="you@company.com"
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
          })}
        />
      </FormField>

      <FormField label="Password" error={errors.password?.message}>
        <input
          type="password"
          autoComplete="current-password"
          className={`${inputClass} ${errors.password ? inputErrorClass : ''}`}
          placeholder="••••••••"
          {...register('password', {
            required: 'Password is required',
          })}
        />
      </FormField>

      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm text-brand hover:underline">
          Forgot password?
        </Link>
      </div>

      {serverError && (
        <p className="rounded-xl border border-danger/20 bg-danger-light px-4 py-2.5 text-sm text-danger" role="alert">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
