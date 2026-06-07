'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { acceptInvite, login, setSession } from '../../../lib/api';
import { getTenantUrl } from '../../../lib/tenant';

export default function InviteAcceptPage() {
  const { token } = useParams();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await acceptInvite({
        token,
        name: form.name,
        password: form.password,
      });

      const loginResult = await login({
        email: result.user.email,
        password: form.password,
        tenantId: result.tenant._id,
      });

      setSession(loginResult);
      router.push(getTenantUrl(result.tenant.subdomain, '/dashboard'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-bold text-zinc-900">Accept invitation</h1>
      <p className="mt-2 text-sm text-zinc-600">Create your account to join the workspace.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <input
          required
          placeholder="Your name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full rounded-lg border px-3 py-2"
        />
        <input
          required
          type="password"
          minLength={8}
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full rounded-lg border px-3 py-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white"
        >
          {loading ? 'Joining…' : 'Join workspace'}
        </button>
      </form>
    </main>
  );
}
