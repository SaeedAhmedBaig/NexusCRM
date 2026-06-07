'use client';

import { ToastStack } from '../ui/toast-stack';

export function NotificationProvider({ children }) {
  return (
    <>
      {children}
      <ToastStack />
    </>
  );
}
