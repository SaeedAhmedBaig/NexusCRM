import { apiFetch } from './api';

function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') qs.set(key, String(value));
  });
  const str = qs.toString();
  return str ? `?${str}` : '';
}

export function listTasks(params) {
  return apiFetch(`/tasks${buildQuery(params)}`);
}

export function getTask(id) {
  return apiFetch(`/tasks/${id}`);
}

export function createTask(payload) {
  return apiFetch('/tasks', { method: 'POST', body: payload });
}

export function updateTask(id, payload) {
  return apiFetch(`/tasks/${id}`, { method: 'PATCH', body: payload });
}

export function manageSubtasks(id, payload) {
  return apiFetch(`/tasks/${id}/subtasks`, { method: 'POST', body: payload });
}

export function addTaskComment(id, body) {
  return apiFetch(`/tasks/${id}/comments`, { method: 'POST', body: { body } });
}

export function toggleHideTaskForMe(id) {
  return apiFetch(`/tasks/${id}/hide-for-me`, { method: 'POST' });
}

export function listProjects() {
  return apiFetch('/projects');
}

export function getProject(id) {
  return apiFetch(`/projects/${id}`);
}

export function createProject(payload) {
  return apiFetch('/projects', { method: 'POST', body: payload });
}

export function listMemos(params) {
  return apiFetch(`/memos${buildQuery(params)}`);
}

export function getMemo(id) {
  return apiFetch(`/memos/${id}`);
}

export function createMemo(payload) {
  return apiFetch('/memos', { method: 'POST', body: payload });
}

export function updateMemo(id, payload) {
  return apiFetch(`/memos/${id}`, { method: 'PATCH', body: payload });
}

export function reviewMemo(id) {
  return apiFetch(`/memos/${id}/review`, { method: 'POST' });
}

export function convertMemoToTask(id) {
  return apiFetch(`/memos/${id}/convert-to-task`, { method: 'POST' });
}

export function convertMemoToProject(id) {
  return apiFetch(`/memos/${id}/convert-to-project`, { method: 'POST' });
}
