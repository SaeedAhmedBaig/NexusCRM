'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useForm, useWatch } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { FormField, inputClass } from '../ui/form-field';
import { completeOnboarding } from '../../lib/api';
import { createEmailAccount } from '../../lib/mail-api';
import { getTenantUrl } from '../../lib/tenant';

const STEPS = [
  { id: 1, title: 'Company details' },
  { id: 2, title: 'Departments' },
  { id: 3, title: 'Invite team' },
  { id: 4, title: 'Email account' },
];

const INVITE_ROLES = ['admin', 'manager', 'co-worker', 'accountant'];

export function OnboardingWizard({ subdomain }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [skippedSteps, setSkippedSteps] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { control, register, handleSubmit, setValue } = useForm({
    defaultValues: {
      company: {
        name: '',
        address: '',
        phone: '',
        website: '',
        logoUrl: '',
      },
      departments: [{ name: 'Sales', description: '' }],
      invites: [{ email: '', role: 'co-worker' }],
      emailAccount: {
        configured: false,
        skipped: false,
        provider: 'smtp',
        host: '',
        port: '587',
        username: '',
        password: '',
      },
    },
  });

  const logoUrl = useWatch({ control, name: 'company.logoUrl' });

  function skipStep(stepId) {
    setSkippedSteps((prev) => [...new Set([...prev, stepId])]);
    if (stepId === 4) {
      setValue('emailAccount.skipped', true);
      setValue('emailAccount.configured', false);
    }
    setStep((s) => Math.min(s + 1, STEPS.length));
  }

  function handleLogoFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setValue('company.logoUrl', reader.result);
    reader.readAsDataURL(file);
  }

  async function finish(data) {
    setSubmitting(true);
    setError('');
    try {
      const email = data.emailAccount;
      if (!email.skipped && email.host && email.username && email.password) {
        await createEmailAccount({
          name: data.company.name || email.username,
          email: email.username,
          provider: 'smtp',
          smtpHost: email.host,
          smtpPort: Number(email.port) || 587,
          smtpUser: email.username,
          smtpPassword: email.password,
          imapHost: email.host.replace('smtp.', 'imap.') || email.host,
          imapPort: 993,
          isMain: true,
          doMassmail: true,
          doImport: true,
        });
      }

      const payload = {
        company: data.company,
        departments: data.departments.filter((d) => d.name?.trim()),
        invites: data.invites.filter((i) => i.email?.trim()),
        emailAccount: data.emailAccount.skipped
          ? { skipped: true, configured: false }
          : {
              ...data.emailAccount,
              configured: Boolean(data.emailAccount.host && data.emailAccount.username),
              skipped: false,
            },
        skippedSteps,
      };

      await completeOnboarding(payload);
      router.push(getTenantUrl(subdomain, '/dashboard'));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function nextStep() {
    setStep((s) => Math.min(s + 1, STEPS.length));
  }

  function prevStep() {
    setStep((s) => Math.max(s - 1, 1));
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm font-medium text-muted">
          <span>Step {step} of {STEPS.length}</span>
          <span>{STEPS[step - 1].title}</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-brand transition-all duration-300"
            style={{ width: `${(step / STEPS.length) * 100}%` }}
          />
        </div>
        <div className="mt-4 flex justify-between gap-2">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={`h-1.5 flex-1 rounded-full ${s.id <= step ? 'bg-brand' : 'bg-border'}`}
            />
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(finish)} className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-h2 text-foreground">Tell us about your company</h2>
            <FormField label="Company name">
              <input className={inputClass} {...register('company.name')} placeholder="Acme Inc" />
            </FormField>
            <FormField label="Logo">
              <input type="file" accept="image/*" onChange={handleLogoFile} className="text-sm" />
              {logoUrl && (
                <Image src={logoUrl} alt="Logo preview" width={64} height={64} unoptimized className="mt-2 h-16 w-16 rounded-lg object-cover" />
              )}
            </FormField>
            <FormField label="Address">
              <input className={inputClass} {...register('company.address')} placeholder="123 Main St, City" />
            </FormField>
            <FormField label="Phone">
              <input className={inputClass} {...register('company.phone')} placeholder="+1 555 0100" />
            </FormField>
            <FormField label="Website">
              <input className={inputClass} {...register('company.website')} placeholder="https://acme.com" />
            </FormField>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-h2 text-foreground">Create your first department</h2>
            <p className="text-sm text-muted">Start with Sales — you can add more later in Settings.</p>
            <FormField label="Department name">
              <input className={inputClass} {...register('departments.0.name')} placeholder="Sales" />
            </FormField>
            <FormField label="Description (optional)">
              <input className={inputClass} {...register('departments.0.description')} placeholder="Revenue team" />
            </FormField>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-h2 text-foreground">Invite your team</h2>
            <p className="text-sm text-muted">Optional — invite colleagues now or skip and do it later.</p>
            {[0, 1, 2].map((i) => (
              <div key={i} className="grid gap-3 sm:grid-cols-2">
                <FormField label={i === 0 ? 'Email' : `Email ${i + 1}`}>
                  <input
                    type="email"
                    className={inputClass}
                    {...register(`invites.${i}.email`)}
                    placeholder="colleague@company.com"
                  />
                </FormField>
                <FormField label="Role">
                  <select className={inputClass} {...register(`invites.${i}.role`)}>
                    {INVITE_ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </FormField>
              </div>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-h2 text-foreground">Connect email account</h2>
            <p className="text-sm text-muted">Connect SMTP/IMAP or skip and configure later in Settings.</p>
            <FormField label="Provider">
              <select className={inputClass} {...register('emailAccount.provider')}>
                <option value="smtp">SMTP / IMAP</option>
                <option value="gmail">Gmail (connect via Settings after onboarding)</option>
              </select>
            </FormField>
            <FormField label="SMTP host">
              <input className={inputClass} {...register('emailAccount.host')} placeholder="smtp.gmail.com" />
            </FormField>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Port">
                <input className={inputClass} {...register('emailAccount.port')} placeholder="587" />
              </FormField>
              <FormField label="Username">
                <input className={inputClass} {...register('emailAccount.username')} placeholder="you@company.com" />
              </FormField>
            </div>
            <FormField label="Password">
              <input type="password" className={inputClass} {...register('emailAccount.password')} />
            </FormField>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-xl bg-danger-light px-4 py-2 text-sm text-danger" role="alert">{error}</p>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            {step > 1 && (
              <button type="button" onClick={prevStep} className="text-sm font-medium text-muted hover:text-foreground">
                ← Back
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {(step === 3 || step === 4) && (
              <button
                type="button"
                onClick={() => skipStep(step)}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted hover:bg-surface"
              >
                Skip for now
              </button>
            )}
            {step < STEPS.length ? (
              <button
                type="button"
                onClick={nextStep}
                className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground hover:bg-brand-dark"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground hover:bg-brand-dark disabled:opacity-60"
              >
                {submitting ? 'Finishing…' : 'Go to dashboard'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
