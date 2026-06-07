'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Can } from '../can';
import { getTenantUrl } from '../../lib/tenant';
import { NAV_SECTIONS } from '../../lib/navigation';

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
    const Icon = item.icon;
    const active = isActive(item.href);
    const link = (
      <Link
        key={item.href}
        href={`${base}${item.href}`}
        onClick={onClose}
        title={collapsed ? item.label : undefined}
        className={`group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors ${
          active
            ? 'bg-sidebar-active text-foreground'
            : 'text-muted-foreground hover:bg-sidebar-active hover:text-foreground'
        } ${collapsed ? 'justify-center px-2' : ''}`}
      >
        <Icon className="h-4 w-4 shrink-0 opacity-70" strokeWidth={active ? 2.25 : 1.75} />
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
        className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-150 ${
          collapsed ? 'w-14' : 'w-60'
        } ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div
          className={`flex h-12 shrink-0 items-center border-b border-sidebar-border ${
            collapsed ? 'justify-center px-2' : 'gap-2.5 px-3'
          }`}
        >
          {tenantLogo ? (
            <img src={tenantLogo} alt="" className="h-7 w-7 shrink-0 rounded-md object-cover" />
          ) : (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-foreground text-[11px] font-semibold text-background">
              {initial}
            </span>
          )}
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-foreground">{tenantName || subdomain}</p>
              <p className="truncate text-[11px] text-muted-foreground capitalize">{tenantPlan || 'workspace'}</p>
            </div>
          )}
        </div>

        <nav className={`flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto ${collapsed ? 'p-2' : 'p-2 pt-3'}`}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.label || 'main'}>
              {section.label && !collapsed && (
                <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.label}
                </p>
              )}
              {section.label && collapsed && <div className="mb-2 border-t border-sidebar-border" />}
              <div className="flex flex-col gap-0.5">{section.items.map(renderLink)}</div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
