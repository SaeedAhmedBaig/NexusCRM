'use client';

import { Activity } from 'lucide-react';
import { getTenantUrl } from '../../lib/tenant';
import { EmptyState } from '../ui/empty-state';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ActivityFeed({ subdomain, items = [], compact = false }) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-card/85 shadow-sm backdrop-blur">
      <div className={`border-b border-border/70 ${compact ? 'px-4 py-3' : 'px-5 py-4'}`}>
        <h3 className={compact ? 'text-sm font-semibold text-foreground' : 'text-h3 text-foreground'}>Journey activity</h3>
        <p className="mt-0.5 text-sm text-muted">Latest customer movement</p>
      </div>
      {!items.length ? (
        <div className="p-4">
          <EmptyState
            icon={Activity}
            title="No activity yet"
            description="Deal updates, task assignments, and emails will appear here."
          />
        </div>
      ) : (
        <ul className={`divide-y divide-border/60 ${compact ? 'max-h-52 overflow-y-auto' : ''}`}>
          {items.map((item) => {
            const href = item.href
              ? getTenantUrl(subdomain, item.href.startsWith('/') ? item.href : `/${item.href}`)
              : getTenantUrl(subdomain, '/dashboard');
            return (
              <li key={item.id}>
                <a
                  href={href}
                  className={`block transition-colors hover:bg-white/65 ${compact ? 'px-4 py-2.5' : 'px-5 py-3.5'}`}
                >
                  <p className="text-sm font-medium text-foreground">{item.summary}</p>
                  <p className="mt-0.5 text-meta">
                    {item.userName} · {timeAgo(item.createdAt)}
                  </p>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
