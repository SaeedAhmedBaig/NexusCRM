'use client';

import { io } from 'socket.io-client';
import { getToken } from './api';

let socket = null;

export function getSocket() {
  if (typeof window === 'undefined') return null;
  if (socket?.connected) return socket;

  const raw = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
  const wsUrl = raw.replace('://localhost', '://127.0.0.1');
  const token = getToken();

  socket = io(wsUrl, {
    path: '/socket.io',
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: Boolean(token),
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
