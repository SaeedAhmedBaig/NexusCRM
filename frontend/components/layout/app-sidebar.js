'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Can } from '../can';
import { getTenantUrl } from '../../lib/tenant';
import { NAV_SECTIONS } from '../../lib/navigation';
import { canUsePlan } from '../../lib/plan-access';

export function AppSidebar({
  subdomain,
  rules,
  tenantName,
  tenantPlan,
  tenantLogo,
  open,
  onClose,
  collapsed,
}) {
  const pathname = usePathname();
  const base = getTenantUrl(subdomain);

  function isActive(href) {
    const full = `${base}${href}`;
    if (href === '/dashboard') {
      return pathname === full || pathname === `${base}` || pathname?.endsWith('/dashboard');
    }
    return pathname?.startsWith(full);
  }

  const initial = (tenantName || subdomain || 'N').charAt(0).toUpperCase();

  function renderLink(item) {
    if (item.minPlan && !canUsePlan(item.minPlan, tenantPlan)) return null;
    const Icon = item.icon;
    const active = isActive(item.href);
    const link = (
      <Link
        key={item.href}
        href={`${base}${item.href}`}
        onClick={onClose}
        title={collapsed ? item.label : undefined}
        className={`group flex h-8 items-center gap-2 rounded-[var(--button-radius)] px-2.5 text-[12px] font-semibold transition-all ${
          active
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-muted-foreground hover:bg-surface-hover-subtle hover:text-sidebar-accent-foreground'
        } ${collapsed ? 'justify-center px-2.5' : ''}`}
      >
        <Icon className="h-4 w-4 shrink-0 opacity-80" strokeWidth={active ? 2.25 : 1.75} />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );

    if (item.action && item.subject) {
      return (
        <Can key={item.href} action={item.action} subject={item.subject} rules={rules}>
          {link}
        </Can>
      );
    }
    return link;
  }

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-foreground/10 backdrop-blur-[2px] lg:hidden"
          aria-label="Close menu"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 border-r border-sidebar-border bg-sidebar transition-all duration-150 ${
          collapsed ? 'w-[74px]' : 'w-[220px]'
        } ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex h-full flex-col overflow-hidden">
        <div
          className={`flex h-14 shrink-0 items-center border-b border-sidebar-border/70 ${
            collapsed ? 'justify-center px-2' : 'gap-2.5 px-4'
          }`}
        >
          {tenantLogo ? (
            <Image src={tenantLogo} alt="" width={32} height={32} unoptimized className="h-8 w-8 shrink-0 rounded-[var(--button-radius)] object-cover" />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--button-radius)] bg-[image:var(--brand-gradient)] text-sm font-semibold text-brand-foreground">
              {initial}
            </span>
          )}
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold text-foreground">{tenantName || subdomain}</p>
              <p className="truncate text-[10px] font-medium text-muted-foreground capitalize">{tenantPlan || 'workspace'}</p>
            </div>
          )}
        </div>

        <nav className={`flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto ${collapsed ? 'p-2' : 'p-2.5 pt-3'}`}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.label || 'main'}>
              {section.label && !collapsed && (
                <p className="mb-1.5 px-2 text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  {section.label}
                </p>
              )}
              {section.label && collapsed && <div className="mb-2 border-t border-sidebar-border/70" />}
              <div className="flex flex-col gap-0.5">{section.items.map(renderLink)}</div>
            </div>
          ))}
        </nav>
        </div>
      </aside>
    </>
  );
}
