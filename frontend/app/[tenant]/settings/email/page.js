'use client';

import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { FormField, inputClass } from '../../../../components/ui/form-field';
import { completeOnboarding, getOnboardingStatus } from '../../../../lib/api';
import { SettingsPageShell, SettingsPrimaryButton, SettingsSection } from '../../../../components/settings/settings-layout';

export default function EmailSettingsPage({ params }) {
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
    params.then(async () => {
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
      <SettingsPageShell
        title="Email account"
        description="Connect SMTP to send mail from your workspace."
      >

        {saved ? (
          <p className="border border-success/30 bg-success-light p-4 text-sm text-success">Email settings saved.</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <SettingsSection title="SMTP connection" description="Workspace outbound mail server credentials.">
              <div className="space-y-4 p-4">
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
              </div>
            </SettingsSection>
            <SettingsPrimaryButton type="submit">
              Save email settings
            </SettingsPrimaryButton>
          </form>
        )}
      </SettingsPageShell>
  );
}
