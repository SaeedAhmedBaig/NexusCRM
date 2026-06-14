'use client';

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { getMyTenants, switchTenant, setSession } from '../lib/api';
import { getTenantUrl } from '../lib/tenant';

export function TenantSwitcher({ currentSubdomain }) {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyTenants()
      .then(setTenants)
      .catch(() => setTenants([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || tenants.length <= 1) return null;

  async function handleSwitch(tenantId, subdomain) {
    const result = await switchTenant(tenantId);
    setSession({
      token: result.token,
      tenant: result.tenant,
      rules: result.rules,
    });
    window.location.href = getTenantUrl(subdomain, '/dashboard');
  }

  return (
    <div className="relative">
      <select
        className="h-10 appearance-none rounded-full border border-border bg-card/85 py-1.5 pl-4 pr-9 text-[13px] font-medium text-foreground shadow-sm outline-none backdrop-blur transition-colors hover:bg-card focus:border-foreground/30 focus:ring-2 focus:ring-ring"
        value={currentSubdomain}
        onChange={(e) => {
          const selected = tenants.find((t) => t.subdomain === e.target.value);
          if (selected) handleSwitch(selected.tenantId, selected.subdomain);
        }}
      >
        {tenants.map((t) => (
          <option key={t.tenantId} value={t.subdomain}>
            {t.name}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
