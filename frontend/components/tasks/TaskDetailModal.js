'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Plus, Trash2, EyeOff } from 'lucide-react';
import {
  updateTask,
  manageSubtasks,
  addTaskComment,
  toggleHideTaskForMe,
} from '../../lib/tasks-api';
import { ObjectChat } from '../chat/ObjectChat';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES = [
  { value: 'todo', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Completed' },
];

export function TaskDetailModal({ task, users, projects, currentUserId, currentUserName, open, onClose, onUpdated }) {
  const [tab, setTab] = useState('details');
  const [newSubtask, setNewSubtask] = useState('');
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset } = useForm();

  const updateMutation = useMutation({
    mutationFn: (payload) => updateTask(task.id, payload),
    onSuccess: (data) => {
      onUpdated?.(data);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const subtaskMutation = useMutation({
    mutationFn: (payload) => manageSubtasks(task.id, payload),
    onSuccess: (data) => {
      onUpdated?.(data);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: (body) => addTaskComment(task.id, body),
    onSuccess: (data) => {
      onUpdated?.(data);
      setComment('');
    },
  });

  if (!open || !task) return null;

  const mySubtasks = (task.subtasks || []).filter((s) => s.assignedTo === currentUserId);
  const allMySubtasksDone = mySubtasks.length > 0 && mySubtasks.every((s) => s.completed);
  const isHidden = task.hiddenForUsers?.includes(currentUserId);

  function onSaveDetails(values) {
    const assignees = values.assignees
      ? Array.isArray(values.assignees)
        ? values.assignees
        : [values.assignees].filter(Boolean)
      : undefined;
    updateMutation.mutate({ ...values, assignees });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold">{task.title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-surface"><X className="h-5 w-5" /></button>
        </div>

        <div className="border-b border-border px-5">
          <nav className="-mb-px flex gap-4">
            {['details', 'subtasks', 'workflow', 'comments', 'chat'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`border-b-2 py-3 text-sm font-medium capitalize ${
                  tab === t ? 'border-brand text-brand' : 'border-transparent text-muted'
                }`}
              >
                {t}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'details' && (
            <form
              onSubmit={handleSubmit(onSaveDetails)}
              className="space-y-4"
              key={task.id}
            >
              <input type="hidden" {...register('title')} defaultValue={task.title} />
              <label className="block text-sm">
                <span className="font-medium text-muted">Title</span>
                <input
                  {...register('title')}
                  defaultValue={task.title}
                  className="mt-1 w-full rounded-xl border border-border px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-muted">Description</span>
                <textarea
                  {...register('description')}
                  defaultValue={task.description || ''}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-border px-3 py-2"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="font-medium text-muted">Status</span>
                  <select {...register('status')} defaultValue={task.status} className="mt-1 w-full rounded-xl border border-border px-3 py-2 capitalize">
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-muted">Priority</span>
                  <select {...register('priority')} defaultValue={task.priority} className="mt-1 w-full rounded-xl border border-border px-3 py-2 capitalize">
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="font-medium text-muted">Due date</span>
                  <input
                    type="date"
                    {...register('dueDate')}
                    defaultValue={task.dueDate ? task.dueDate.slice(0, 10) : ''}
                    className="mt-1 w-full rounded-xl border border-border px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-muted">Project</span>
                  <select {...register('projectId')} defaultValue={task.projectId || ''} className="mt-1 w-full rounded-xl border border-border px-3 py-2">
                    <option value="">None</option>
                    {(projects || []).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block text-sm">
                <span className="font-medium text-muted">Assignees</span>
                <select
                  multiple
                  {...register('assignees')}
                  defaultValue={task.assignees || []}
                  className="mt-1 h-24 w-full rounded-xl border border-border px-3 py-2"
                >
                  {(users || []).map((u) => (
                    <option key={u.userId || u.id} value={u.userId || u.id}>{u.name || u.email}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium text-muted">Next step</span>
                <input
                  {...register('nextStep')}
                  defaultValue={task.nextStep || ''}
                  placeholder="What happens next?"
                  className="mt-1 w-full rounded-xl border border-border px-3 py-2"
                />
              </label>
              <button type="submit" disabled={updateMutation.isPending} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white">
                {updateMutation.isPending ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          )}

          {tab === 'subtasks' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  placeholder="Add subtask…"
                  className="flex-1 rounded-xl border border-border px-3 py-2 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newSubtask.trim()) {
                      subtaskMutation.mutate({ action: 'add', subtask: { title: newSubtask.trim() } });
                      setNewSubtask('');
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newSubtask.trim()) return;
                    subtaskMutation.mutate({ action: 'add', subtask: { title: newSubtask.trim() } });
                    setNewSubtask('');
                  }}
                  className="rounded-xl bg-brand px-3 py-2 text-white"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-muted">Progress: {task.progress || 0}%</p>
              <ul className="space-y-2">
                {(task.subtasks || []).map((st) => (
                  <li key={st.id} className="flex items-center gap-3 rounded-xl border border-border px-3 py-2">
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => subtaskMutation.mutate({ action: 'toggle', subtask: { id: st.id, completed: !st.completed } })}
                    />
                    <span className={`flex-1 text-sm ${st.completed ? 'text-muted line-through' : ''}`}>{st.title}</span>
                    <button
                      type="button"
                      onClick={() => subtaskMutation.mutate({ action: 'delete', subtask: { id: st.id } })}
                      className="text-muted hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
              {allMySubtasksDone && (
                <button
                  type="button"
                  onClick={() => toggleHideTaskForMe(task.id).then(() => queryClient.invalidateQueries({ queryKey: ['tasks'] }))}
                  className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
                >
                  <EyeOff className="h-4 w-4" />
                  {isHidden ? 'Show completed for me' : 'Hide completed for me'}
                </button>
              )}
            </div>
          )}

          {tab === 'workflow' && (
            <ul className="space-y-2">
              {(task.workflowLog || []).length === 0 ? (
                <p className="text-sm text-muted">No workflow history yet.</p>
              ) : (
                [...(task.workflowLog || [])].reverse().map((w) => (
                  <li key={w.id} className="rounded-xl border border-border px-3 py-2 text-sm">
                    <p className="font-medium capitalize">{w.action.replace(/_/g, ' ')}</p>
                    <p className="text-muted">{w.note}</p>
                    <p className="mt-1 text-xs text-muted">{w.userName} · {new Date(w.at).toLocaleString()}</p>
                  </li>
                ))
              )}
            </ul>
          )}

          {tab === 'chat' && (
            <ObjectChat
              entityType="Task"
              objectId={task.id}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
            />
          )}

          {tab === 'comments' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write a comment…"
                  className="flex-1 rounded-xl border border-border px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  disabled={!comment.trim()}
                  onClick={() => commentMutation.mutate(comment.trim())}
                  className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Send
                </button>
              </div>
              <ul className="space-y-3">
                {(task.comments || []).map((c) => (
                  <li key={c.id} className="rounded-xl bg-surface-elevated px-3 py-2 text-sm">
                    <p className="font-medium">{c.userName}</p>
                    <p>{c.body}</p>
                    <p className="mt-1 text-xs text-muted">{new Date(c.createdAt).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
