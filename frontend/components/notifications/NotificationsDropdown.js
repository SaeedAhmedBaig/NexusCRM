'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { getSocket } from '../../lib/socket';
import { listNotifications, getUnreadNotificationCount, markNotificationRead } from '../../lib/realtime-api';
import { getTenantUrl } from '../../lib/tenant';
import { toast } from '../../lib/notify';
import { IconButton } from '../ui/icon-button';

export function NotificationsDropdown({ subdomain }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    const [notes, countRes] = await Promise.all([
      listNotifications({ limit: 10 }),
      getUnreadNotificationCount(),
    ]);
    setItems(notes);
    setUnread(countRes?.count ?? countRes ?? 0);
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    if (!socket.connected) socket.connect();

    function onNotification(note) {
      setItems((prev) => [note, ...prev].slice(0, 10));
      setUnread((c) => c + 1);
      if (note?.title || note?.body) {
        toast.info(note.title || 'Notification', note.body || note.message);
      }
    }

    socket.on('notification', onNotification);
    return () => socket.off('notification', onNotification);
  }, []);

  async function handleClick(note) {
    if (!note.read) {
      await markNotificationRead(note.id);
      setUnread((c) => Math.max(0, c - 1));
      setItems((prev) => prev.map((n) => (n.id === note.id ? { ...n, read: true } : n)));
    }
    setOpen(false);
    if (note.href) {
      router.push(getTenantUrl(subdomain, note.href));
    }
  }

  return (
    <div className="relative">
      <IconButton
        onClick={() => {
          setOpen((v) => !v);
          if (!open) load();
        }}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        className="relative"
      >
        <Bell className="h-4 w-4" strokeWidth={1.75} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-brand-foreground ring-2 ring-background">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </IconButton>

      {open && (
        <>
          <button type="button" className="fixed inset-0 z-10" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-lg backdrop-blur">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Notifications</p>
              {unread > 0 && (
                <span className="rounded-full bg-brand-muted px-2 py-0.5 text-[11px] font-medium text-brand">
                  {unread} new
                </span>
              )}
            </div>
            <ul className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-muted-foreground">No notifications</li>
              ) : (
                items.map((note) => (
                  <li key={note.id}>
                    <button
                      type="button"
                      onClick={() => handleClick(note)}
                      className={`w-full border-b border-border/60 px-4 py-3 text-left text-sm transition-colors last:border-0 hover:bg-muted ${
                        !note.read ? 'bg-muted/50' : ''
                      }`}
                    >
                      <p className="font-medium text-foreground">{note.title}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{note.body}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {new Date(note.createdAt).toLocaleString()}
                      </p>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
