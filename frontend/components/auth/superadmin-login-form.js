'use client';

import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { FormField, inputClass, inputErrorClass } from '../ui/form-field';

export function SuperadminLoginForm({ onSubmit }) {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { email: '', password: '' },
  });

  async function submit(data) {
    setLoading(true);
    setServerError('');
    try {
      await onSubmit(data);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
      <FormField label="Admin email" error={errors.email?.message}>
        <input
          type="email"
          autoComplete="username"
          className={`${inputClass} ${errors.email ? inputErrorClass : ''}`}
          placeholder="admin@nexuscrm.com"
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
          {...register('password', { required: 'Password is required' })}
        />
      </FormField>

      {serverError && (
        <p className="rounded-xl border border-danger/20 bg-danger-light px-4 py-2.5 text-sm text-danger" role="alert">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="h-12 rounded-full bg-brand px-4 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-dark disabled:opacity-60"
      >
        {loading ? 'Signing in…' : 'Sign in to admin portal'}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        Credentials are configured in <code className="text-foreground">backend/.env</code>
      </p>
    </form>
  );
}
