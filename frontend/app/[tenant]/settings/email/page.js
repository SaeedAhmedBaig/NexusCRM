'use client';

import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FormField, inputClass } from '../../../../components/ui/form-field';
import { completeOnboarding, getOnboardingStatus } from '../../../../lib/api';
import { getTenantUrl } from '../../../../lib/tenant';
import { TenantNav } from '../../../../components/tenant-nav';

export default function EmailSettingsPage({ params }) {
  const [subdomain, setSubdomain] = useState('');
  const [saved, setSaved] = useState(false);
  const { register, handleSubmit } = useForm({
    defaultValues: {
      host: '',
      port: '587',
      username: '',
      password: '',
      provider: 'smtp',
    },
  });

  useEffect(() => {
    params.then(async ({ tenant }) => {
      setSubdomain(tenant);
      const status = await getOnboardingStatus();
      const email = status.settings?.emailAccount;
      if (email?.host) {
        /* pre-fill if partially saved */
      }
    });
  }, [params]);

  async function onSubmit(data) {
    const status = await getOnboardingStatus();
    await completeOnboarding({
      company: status.settings?.company || {},
      departments: [],
      invites: [],
      emailAccount: {
        ...data,
        configured: true,
        skipped: false,
      },
      skippedSteps: (status.settings?.skippedSteps || []).filter((s) => s !== 4),
    });
    setSaved(true);
  }

  return (
    <>
      <TenantNav subdomain={subdomain} />
      <main className="mx-auto max-w-lg px-6 py-10">
        <Link href={getTenantUrl(subdomain, '/settings')} className="text-sm text-brand">← Settings</Link>
        <h1 className="mt-4 text-2xl font-bold text-foreground">Email account</h1>
        <p className="mt-1 text-sm text-muted">Connect SMTP to send mail from your workspace.</p>

        {saved ? (
          <p className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">Email settings saved.</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <FormField label="SMTP host">
              <input className={inputClass} {...register('host', { required: true })} placeholder="smtp.gmail.com" />
            </FormField>
            <FormField label="Port">
              <input className={inputClass} {...register('port')} />
            </FormField>
            <FormField label="Username">
              <input className={inputClass} {...register('username', { required: true })} />
            </FormField>
            <FormField label="Password">
              <input type="password" className={inputClass} {...register('password')} />
            </FormField>
            <button type="submit" className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white">
              Save email settings
            </button>
          </form>
        )}
      </main>
    </>
  );
}
