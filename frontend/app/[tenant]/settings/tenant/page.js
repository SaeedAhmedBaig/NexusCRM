'use client';

import { useEffect, useState } from 'react';
import { getTenantSettings, updateTenantSettings, listDepartments, listLeadSources } from '../../../../lib/api';
import { useSession } from '../../../../components/providers/session-context';
import { Can } from '../../../../components/can';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { inputClass } from '../../../../components/ui/form-field';

export default function TenantSettingsPage() {
  const { profile } = useSession();
  const [form, setForm] = useState({
    name: '',
    subdomain: '',
    customDomain: '',
    defaultDepartmentId: '',
    logoUrl: '',
    address: '',
    phone: '',
    website: '',
  });
  const [departments, setDepartments] = useState([]);
  const [leadSources, setLeadSources] = useState([]);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const isPro = ['Professional', 'Business', 'Enterprise', 'Pro'].includes(profile?.tenant?.plan);

  useEffect(() => {
    Promise.all([getTenantSettings(), listDepartments(), listLeadSources().catch(() => [])])
      .then(([settings, depts, sources]) => {
        setDepartments(depts);
        setLeadSources(sources);
        setForm({
          name: settings.name || '',
          subdomain: settings.subdomain || '',
          customDomain: settings.customDomain || '',
          defaultDepartmentId: settings.defaultDepartmentId || '',
          logoUrl: settings.settings?.company?.logoUrl || '',
          address: settings.settings?.company?.address || '',
          phone: settings.settings?.company?.phone || '',
          website: settings.settings?.company?.website || '',
        });
      })
      .catch((e) => setError(e.message));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await updateTenantSettings({
        name: form.name,
        subdomain: form.subdomain,
        customDomain: form.customDomain || null,
        defaultDepartmentId: form.defaultDepartmentId || null,
        settings: {
          company: {
            logoUrl: form.logoUrl,
            address: form.address,
            phone: form.phone,
            website: form.website,
          },
        },
      });
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Can action="manage" subject="Settings" rules={profile?.rules} fallback={<p className="text-muted">Admin access required.</p>}>
      <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tenant settings</h1>
          <p className="mt-1 text-sm text-muted">Company profile and workspace configuration.</p>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}
        {saved && <p className="text-sm text-success">Settings saved.</p>}

        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <input className={inputClass} placeholder="Company name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <input className={inputClass} placeholder="Logo URL" value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} />
              <input className={inputClass} placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              <input className={inputClass} placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input className={inputClass} placeholder="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workspace</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Subdomain</label>
                <input className={inputClass} value={form.subdomain} onChange={(e) => setForm({ ...form, subdomain: e.target.value })} />
                <p className="mt-1 text-xs text-muted">Only the workspace owner can change subdomain.</p>
              </div>
              <div>
                <label className="text-sm font-medium">Custom domain {isPro ? '' : '(Pro+)'}</label>
                <input
                  className={inputClass}
                  placeholder="crm.yourcompany.com"
                  value={form.customDomain}
                  onChange={(e) => setForm({ ...form, customDomain: e.target.value })}
                  disabled={!isPro}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Default department</label>
                <select className={inputClass} value={form.defaultDepartmentId} onChange={(e) => setForm({ ...form, defaultDepartmentId: e.target.value })}>
                  <option value="">None</option>
                  {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save settings'}</Button>
        </form>

        {leadSources.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Web form embeds</CardTitle>
              <CardDescription>Iframe-ready contact forms by lead source</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {leadSources.map((s) => (
                <div key={s.id} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                  <p className="font-medium text-foreground">{s.name}</p>
                  {s.embedUrl && (
                    <code className="mt-1 block break-all text-xs text-muted">{s.embedUrl}</code>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </Can>
  );
}
