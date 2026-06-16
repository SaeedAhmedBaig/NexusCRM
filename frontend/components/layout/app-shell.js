'use client';

import { useState } from 'react';
import { AppSidebar } from './app-sidebar';
import { AppTopbar } from './app-topbar';

function getTrialMessage(tenant) {
  if (tenant?.status !== 'trial') return null;
  if (!tenant.trialEndsAt) return 'Trial workspace: choose a paid plan to keep access uninterrupted.';
  const days = Math.max(Math.ceil((new Date(tenant.trialEndsAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)), 0);
  if (days === 0) return 'Your trial has ended. Choose a paid plan to keep using the workspace.';
  return `Trial workspace: ${days} day${days === 1 ? '' : 's'} remaining.`;
}

export function AppShell({ subdomain, profile, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed ? 74 : 220;
  const trialMessage = getTrialMessage(profile?.tenant);

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
          <div className="mx-auto grid w-full max-w-[1360px] gap-4 px-4 py-4 sm:px-5 lg:px-6 lg:py-5">
            {trialMessage ? (
              <div className="border border-warning/30 bg-warning-light px-4 py-3 text-sm font-medium text-warning">
                {trialMessage} <a href={`/${subdomain}/settings/billing`} className="underline">View plans</a>
              </div>
            ) : null}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
