'use client';

import { ModuleHub } from './module-hub';
import { MODULE_PAGES } from '../../lib/module-pages';
import { getTenantUrl } from '../../lib/tenant';
import { useSession } from '../providers/session-context';

export function ModulePage({ moduleKey, related = [] }) {
  const { subdomain } = useSession();
  const config = MODULE_PAGES[moduleKey];
  if (!config) return null;

  const relatedLinks = related.map((r) => ({
    label: r.label,
    href: getTenantUrl(subdomain, r.href),
  }));

  return (
    <ModuleHub
      title={config.title}
      description={config.description}
      features={config.features}
      relatedLinks={relatedLinks}
      comingSoon={config.comingSoon}
    />
  );
}
