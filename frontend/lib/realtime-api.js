import { apiFetch } from './api';

export function listChatMessages(entityType, objectId) {
  return apiFetch(`/chat/messages?entityType=${encodeURIComponent(entityType)}&objectId=${objectId}`);
}

export function sendChatMessage(payload) {
  return apiFetch('/chat/messages', { method: 'POST', body: payload });
}

export function markChatMessageRead(id) {
  return apiFetch(`/chat/messages/${id}/read`, { method: 'PATCH' });
}

export function getChatAttachmentUrl(id) {
  const base = typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  return `${base}/api/chat/attachments/${id}/download`;
}

export function listNotifications(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/notifications${qs ? `?${qs}` : ''}`);
}

export function getUnreadNotificationCount() {
  return apiFetch('/notifications/unread-count');
}

export function markNotificationRead(id) {
  return apiFetch(`/notifications/${id}/read`, { method: 'PATCH' });
}
