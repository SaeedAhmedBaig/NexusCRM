'use client';

import { useState } from 'react';
import { AppSidebar } from './app-sidebar';
import { AppTopbar } from './app-topbar';

export function AppShell({ subdomain, profile, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed ? 80 : 264;

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar
        subdomain={subdomain}
        tenantName={profile?.tenant?.name}
        tenantPlan={profile?.tenant?.plan}
        tenantLogo={profile?.tenant?.settings?.company?.logoUrl}
        rules={profile?.rules}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
      />
      <div
        className="flex min-h-screen flex-col transition-[margin] duration-150 lg:ml-[var(--sidebar-width)]"
        style={{ '--sidebar-width': `${sidebarWidth}px` }}
      >
        <AppTopbar
          subdomain={subdomain}
          profile={profile}
          onMenuClick={() => setSidebarOpen(true)}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto grid w-full max-w-[1400px] gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
