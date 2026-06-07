'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { dismissToast, getToasts, subscribe } from '../../lib/notify';
import { cn } from '../../lib/utils';

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLES = {
  success: 'border-success/30 bg-success-light text-success',
  error: 'border-danger/30 bg-danger-light text-danger',
  warning: 'border-warning/30 bg-warning-light text-warning',
  info: 'border-brand/25 bg-brand-subtle text-foreground',
};

export function ToastStack() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    setToasts(getToasts());
    return subscribe(() => setToasts([...getToasts()]));
  }, []);

  if (!toasts.length) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[200] flex w-full max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6"
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((t) => {
        const Icon = ICONS[t.type] || Info;
        return (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto animate-fade-in rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm',
              STYLES[t.type] || STYLES.info,
            )}
          >
            <div className="flex items-start gap-3">
              <Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.25} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug">{t.title}</p>
                {t.message && (
                  <p className="mt-0.5 text-sm opacity-90">{t.message}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                className="focus-ring -mr-1 shrink-0 rounded-md p-1 opacity-70 hover:opacity-100"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
