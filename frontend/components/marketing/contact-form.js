'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormField, inputClass, inputErrorClass } from '../ui/form-field';
import { submitContactRequest } from '../../lib/public-api';
import { notifyError, notifySuccess } from '../../lib/notify';

export function ContactForm({ type = 'demo', title, subtitle }) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverMessage, setServerMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: { name: '', email: '', company: '', message: '' },
  });

  async function onSubmit(data) {
    setLoading(true);
    setServerMessage('');
    try {
      const result = await submitContactRequest({
        ...data,
        type,
        sourceUrl: typeof window !== 'undefined' ? window.location.href : '',
      });
      setSubmitted(true);
      setServerMessage(result.message || 'Thank you — we will be in touch soon.');
      notifySuccess(result.message || 'Message sent');
      reset();
    } catch (err) {
      setServerMessage(err.message);
      notifyError(err);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="marketing-card p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-foreground">Message sent</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{serverMessage}</p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-6 text-sm font-medium text-brand hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <div className="marketing-card p-6 sm:p-8">
      {(title || subtitle) && (
        <div className="mb-6">
          {title && <h2 className="text-xl font-semibold text-foreground">{title}</h2>}
          {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField label="Name" error={errors.name?.message}>
          <input
            id="name"
            className={`${inputClass} ${errors.name ? inputErrorClass : ''}`}
            autoComplete="name"
            placeholder="Your name"
            {...register('name', { required: 'Name is required' })}
          />
        </FormField>

        <FormField label="Work email" error={errors.email?.message}>
          <input
            id="email"
            type="email"
            className={`${inputClass} ${errors.email ? inputErrorClass : ''}`}
            autoComplete="email"
            placeholder="you@company.com"
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
            })}
          />
        </FormField>

        <FormField label="Company" error={errors.company?.message}>
          <input
            id="company"
            className={`${inputClass} ${errors.company ? inputErrorClass : ''}`}
            autoComplete="organization"
            placeholder="Company name"
            {...register('company')}
          />
        </FormField>

        <FormField label="Message" error={errors.message?.message}>
          <textarea
            id="message"
            rows={4}
            className={`${inputClass} min-h-[120px] resize-y ${errors.message ? inputErrorClass : ''}`}
            placeholder={
              type === 'demo'
                ? 'Tell us about your team size, use case, and timeline…'
                : 'How can we help?'
            }
            {...register('message', {
              required: type === 'demo' ? 'Please share a few details for your demo' : false,
            })}
          />
        </FormField>

        {serverMessage && !submitted && (
          <p className="rounded-xl border border-danger/20 bg-danger-light px-4 py-2.5 text-sm text-danger" role="alert">
            {serverMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-full bg-brand px-5 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-dark disabled:opacity-60"
        >
          {loading ? 'Sending…' : type === 'demo' ? 'Request demo' : 'Send message'}
        </button>
      </form>
    </div>
  );
}
