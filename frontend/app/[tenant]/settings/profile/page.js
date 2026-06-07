'use client';

import { useEffect, useState } from 'react';
import { getMe, updateProfile } from '../../../../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { inputClass } from '../../../../components/ui/form-field';

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
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="mt-1 text-sm text-muted">Manage your personal account settings.</p>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {saved && <p className="text-sm text-success">Profile updated.</p>}

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal info</CardTitle>
            <CardDescription>Name, email, and avatar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Leave blank to keep current password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input type="password" className={inputClass} placeholder="Current password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
            <input type="password" className={inputClass} placeholder="New password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              ['emailNotifications', 'Email notifications'],
              ['taskReminders', 'Task reminders'],
              ['dealUpdates', 'Deal updates'],
              ['weeklyDigest', 'Weekly digest'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.preferences[key]}
                  onChange={(e) => setForm({ ...form, preferences: { ...form.preferences, [key]: e.target.checked } })}
                />
                {label}
              </label>
            ))}
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save changes'}</Button>
      </form>
    </div>
  );
}
