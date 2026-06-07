'use client';

import { useState } from 'react';

const inputClass =
  'w-full rounded-md border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring';

export function AuthForm({ mode, tenantSubdomain, onSubmit, error }) {
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    tenantName: '',
    subdomain: tenantSubdomain || '',
  });
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setLocalError('');

    try {
      await onSubmit(form);
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      {mode === 'login' && !tenantSubdomain && (
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-foreground">Workspace subdomain</span>
          <input
            required
            value={form.subdomain}
            onChange={(e) => updateField('subdomain', e.target.value)}
            className={inputClass}
            placeholder="yourteam"
          />
        </label>
      )}

      {mode === 'register' && (
        <>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-foreground">Your name</span>
            <input
              required
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className={inputClass}
              placeholder="Jane Doe"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-foreground">Company name</span>
            <input
              required
              value={form.tenantName}
              onChange={(e) => updateField('tenantName', e.target.value)}
              className={inputClass}
              placeholder="Acme Inc"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-foreground">Workspace subdomain</span>
            <input
              required
              value={form.subdomain}
              onChange={(e) => updateField('subdomain', e.target.value)}
              className={inputClass}
              placeholder="acme"
              disabled={Boolean(tenantSubdomain)}
            />
          </label>
        </>
      )}

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-foreground">Email</span>
        <input
          required
          type="email"
          value={form.email}
          onChange={(e) => updateField('email', e.target.value)}
          className={inputClass}
          placeholder="you@company.com"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-foreground">Password</span>
        <input
          required
          type="password"
          minLength={8}
          value={form.password}
          onChange={(e) => updateField('password', e.target.value)}
          className={inputClass}
          placeholder="••••••••"
        />
      </label>

      {(localError || error) && (
        <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {localError || error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
      >
        {loading ? 'Please wait…' : mode === 'register' ? 'Create workspace' : 'Sign in'}
      </button>
    </form>
  );
}
