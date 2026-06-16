'use client';

import { useForm, useWatch } from 'react-hook-form';
import { useState } from 'react';
import { FormField, inputClass, inputErrorClass } from '../ui/form-field';
import { getRecaptchaToken, isRecaptchaEnabled } from '../../lib/recaptcha';
import { getTenantUrl } from '../../lib/tenant';
import { notifyError } from '../../lib/notify';

const PLANS = [
  { id: 'free', label: 'Free', description: 'Up to 3 users · core CRM features' },
  { id: 'pro', label: 'Pro trial', description: '14-day trial · analytics, mass mail, VoIP' },
];

export function SignupForm({ defaultPlan = 'free', onSubmit }) {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
      companyName: '',
      subdomain: '',
      plan: defaultPlan === 'enterprise' ? 'pro' : defaultPlan,
    },
  });

  const subdomain = useWatch({ control, name: 'subdomain' });

  async function submit(data) {
    setLoading(true);
    setServerError('');
    try {
      let recaptchaToken = null;
      if (isRecaptchaEnabled()) {
        recaptchaToken = await getRecaptchaToken('signup');
      }
      await onSubmit({ ...data, recaptchaToken });
    } catch (err) {
      setServerError(err.message);
      notifyError(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
      <FormField label="Work email" error={errors.email?.message}>
        <input
          type="email"
          className={`${inputClass} ${errors.email ? inputErrorClass : ''}`}
          placeholder="you@company.com"
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
          })}
        />
      </FormField>

      <FormField
        label="Password"
        error={errors.password?.message}
        hint="At least 8 characters"
      >
        <input
          type="password"
          className={`${inputClass} ${errors.password ? inputErrorClass : ''}`}
          placeholder="••••••••"
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 8, message: 'Password must be at least 8 characters' },
          })}
        />
      </FormField>

      <FormField label="Company name" error={errors.companyName?.message}>
        <input
          className={`${inputClass} ${errors.companyName ? inputErrorClass : ''}`}
          placeholder="Acme Inc"
          {...register('companyName', {
            required: 'Company name is required',
            minLength: { value: 2, message: 'Company name is too short' },
          })}
        />
      </FormField>

      <FormField
        label="Workspace subdomain"
        error={errors.subdomain?.message}
        hint={subdomain ? `Your URL: ${getTenantUrl(subdomain, '/')}` : 'Letters, numbers, and hyphens only'}
      >
        <input
          className={`${inputClass} ${errors.subdomain ? inputErrorClass : ''}`}
          placeholder="acme"
          {...register('subdomain', {
            required: 'Subdomain is required',
            minLength: { value: 3, message: 'Subdomain must be at least 3 characters' },
            pattern: {
              value: /^[a-z0-9-]+$/,
              message: 'Use lowercase letters, numbers, and hyphens only',
            },
          })}
        />
      </FormField>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-foreground">Select plan</legend>
        {PLANS.map((plan) => (
          <label
            key={plan.id}
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 has-[:checked]:border-brand has-[:checked]:bg-brand-light/50"
          >
            <input
              type="radio"
              value={plan.id}
              className="mt-1 accent-brand"
              {...register('plan', { required: true })}
            />
            <span>
              <span className="block text-sm font-semibold text-foreground">{plan.label}</span>
              <span className="block text-xs text-muted-foreground">{plan.description}</span>
            </span>
          </label>
        ))}
      </fieldset>

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
        {loading ? 'Creating workspace…' : 'Create workspace'}
      </button>

      {isRecaptchaEnabled() && (
        <p className="text-center text-xs text-muted-foreground">
          Protected by reCAPTCHA
        </p>
      )}
    </form>
  );
}
