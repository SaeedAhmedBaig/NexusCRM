/**
 * Imperative toast API — works from apiFetch, mutations, and components.
 * Types: success | error | warning | info
 */

const DEFAULT_DURATION = 4500;

let listeners = new Set();
let idCounter = 0;

function emit() {
  listeners.forEach((fn) => fn());
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const store = {
  toasts: [],
};

export function getToasts() {
  return store.toasts;
}

function pushToast({ type, title, message, duration = DEFAULT_DURATION }) {
  const id = ++idCounter;
  const toast = {
    id,
    type,
    title: title || defaultTitle(type),
    message: message || '',
    duration,
    createdAt: Date.now(),
  };
  store.toasts = [...store.toasts, toast].slice(-5);
  emit();

  if (duration > 0) {
    setTimeout(() => dismissToast(id), duration);
  }
  return id;
}

function defaultTitle(type) {
  switch (type) {
    case 'success':
      return 'Success';
    case 'error':
      return 'Something went wrong';
    case 'warning':
      return 'Warning';
    default:
      return 'Notice';
  }
}

export function dismissToast(id) {
  store.toasts = store.toasts.filter((t) => t.id !== id);
  emit();
}

export function notify(type, titleOrMessage, message) {
  if (typeof titleOrMessage === 'string' && message === undefined) {
    return pushToast({ type, message: titleOrMessage });
  }
  return pushToast({ type, title: titleOrMessage, message });
}

export const toast = {
  success: (title, message) => notify('success', title, message),
  error: (title, message) => notify('error', title, message),
  warning: (title, message) => notify('warning', title, message),
  info: (title, message) => notify('info', title, message),
  dismiss: dismissToast,
};

export function notifyError(error, fallback = 'Request failed') {
  const message = error?.message || (typeof error === 'string' ? error : fallback);
  toast.error(message);
  return message;
}

export function notifySuccess(message, title = 'Done') {
  toast.success(title, message);
}
