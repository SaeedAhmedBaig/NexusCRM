'use client';

import { useEffect, useState } from 'react';
import { getMe, updateProfile } from '../../../../lib/api';
import { inputClass } from '../../../../components/ui/form-field';
import { SettingsPageShell, SettingsPrimaryButton, SettingsSection } from '../../../../components/settings/settings-layout';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
];

export default function ProfileSettingsPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    avatarUrl: '',
    language: 'en',
    currentPassword: '',
    password: '',
    preferences: {
      emailNotifications: true,
      taskReminders: true,
      dealUpdates: true,
      weeklyDigest: false,
    },
  });
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getMe().then((p) => {
      setForm((f) => ({
        ...f,
        name: p.user?.name || '',
        email: p.user?.email || '',
        avatarUrl: p.user?.avatarUrl || '',
        language: p.user?.language || 'en',
        preferences: { ...f.preferences, ...(p.user?.preferences || {}) },
      }));
    }).catch((e) => setError(e.message));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSaved(false);
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        avatarUrl: form.avatarUrl,
        language: form.language,
        preferences: form.preferences,
      };
      if (form.password) {
        payload.currentPassword = form.currentPassword;
        payload.password = form.password;
      }
      await updateProfile(payload);
      setSaved(true);
      setForm((f) => ({ ...f, currentPassword: '', password: '' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SettingsPageShell
      title="Profile"
      description="Manage your personal account, password, and notification defaults."
    >

      {error && <p className="text-sm text-danger">{error}</p>}
      {saved && <p className="text-sm text-success">Profile updated.</p>}

      <form onSubmit={handleSave} className="space-y-6">
        <SettingsSection title="Personal info" description="Name, email, avatar, and language.">
          <div className="space-y-4 p-4">
            <div>
              <label className="text-sm font-medium text-foreground">Name</label>
              <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Email</label>
              <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Avatar URL</label>
              <input className={inputClass} value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} placeholder="https://…" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Language</label>
              <select className={inputClass} value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
                {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection title="Password" description="Leave blank to keep your current password.">
          <div className="space-y-4 p-4">
            <input type="password" className={inputClass} placeholder="Current password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
            <input type="password" className={inputClass} placeholder="New password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
        </SettingsSection>

        <SettingsSection title="Notifications" description="Choose which workspace updates should notify you.">
            {[
              ['emailNotifications', 'Email notifications'],
              ['taskReminders', 'Task reminders'],
              ['dealUpdates', 'Deal updates'],
              ['weeklyDigest', 'Weekly digest'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>{label}</span>
                <input
                  type="checkbox"
                  checked={form.preferences[key]}
                  onChange={(e) => setForm({ ...form, preferences: { ...form.preferences, [key]: e.target.checked } })}
                />
              </label>
            ))}
        </SettingsSection>

        <SettingsPrimaryButton type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save changes'}</SettingsPrimaryButton>
      </form>
    </SettingsPageShell>
  );
}
