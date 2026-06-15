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

  const { register, handleSubmit } = useForm();

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
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-border bg-card shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-border bg-muted px-6 py-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Task card</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-foreground">{task.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {task.project?.name || 'No project'} · {task.priority || 'medium'} priority · {task.progress || 0}% checklist
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-card"><X className="h-5 w-5" /></button>
        </div>

        <div className="border-b border-border px-5 py-3">
          <nav className="flex flex-wrap gap-2">
            {['details', 'subtasks', 'workflow', 'comments', 'chat'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-full px-3 py-2 text-sm font-semibold capitalize ${
                  tab === t ? 'bg-brand text-brand-foreground' : 'bg-control text-muted-foreground hover:bg-control-hover hover:text-foreground'
                }`}
              >
                {t}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'details' && (
            <form
              onSubmit={handleSubmit(onSaveDetails)}
              className="grid gap-4 lg:grid-cols-2"
              key={task.id}
            >
              <input type="hidden" {...register('title')} defaultValue={task.title} />
              <label className="block text-sm">
                <span className="font-medium text-muted-foreground">Title</span>
                <input
                  {...register('title')}
                  defaultValue={task.title}
                  className="mt-1 w-full rounded-2xl border border-border bg-control px-4 py-3"
                />
              </label>
              <label className="block text-sm lg:col-span-2">
                <span className="font-medium text-muted-foreground">Description</span>
                <textarea
                  {...register('description')}
                  defaultValue={task.description || ''}
                  rows={3}
                  className="mt-1 w-full rounded-2xl border border-border bg-control px-4 py-3"
                />
              </label>
              <div className="grid grid-cols-2 gap-3 lg:col-span-2">
                <label className="block text-sm">
                  <span className="font-medium text-muted-foreground">Status</span>
                  <select {...register('status')} defaultValue={task.status} className="mt-1 w-full rounded-2xl border border-border bg-control px-4 py-3 capitalize">
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-muted-foreground">Priority</span>
                  <select {...register('priority')} defaultValue={task.priority} className="mt-1 w-full rounded-2xl border border-border bg-control px-4 py-3 capitalize">
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3 lg:col-span-2">
                <label className="block text-sm">
                  <span className="font-medium text-muted-foreground">Due date</span>
                  <input
                    type="date"
                    {...register('dueDate')}
                    defaultValue={task.dueDate ? task.dueDate.slice(0, 10) : ''}
                    className="mt-1 w-full rounded-2xl border border-border bg-control px-4 py-3"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-muted-foreground">Project</span>
                  <select {...register('projectId')} defaultValue={task.projectId || ''} className="mt-1 w-full rounded-2xl border border-border bg-control px-4 py-3">
                    <option value="">None</option>
                    {(projects || []).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block text-sm lg:col-span-2">
                <span className="font-medium text-muted-foreground">Assignees</span>
                <select
                  multiple
                  {...register('assignees')}
                  defaultValue={task.assignees || []}
                  className="mt-1 h-24 w-full rounded-2xl border border-border bg-control px-4 py-3"
                >
                  {(users || []).map((u) => (
                    <option key={u.userId || u.id} value={u.userId || u.id}>{u.name || u.email}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm lg:col-span-2">
                <span className="font-medium text-muted-foreground">Next step</span>
                <input
                  {...register('nextStep')}
                  defaultValue={task.nextStep || ''}
                  placeholder="What happens next?"
                  className="mt-1 w-full rounded-2xl border border-border bg-control px-4 py-3"
                />
              </label>
              <button type="submit" disabled={updateMutation.isPending} className="h-11 rounded-full bg-brand px-5 text-sm font-semibold text-brand-foreground lg:col-span-2">
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
                  className="flex-1 rounded-2xl border border-border bg-control px-4 py-3 text-sm"
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
                  className="rounded-full bg-brand px-4 py-2 text-brand-foreground"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Progress: {task.progress || 0}%</p>
              <ul className="space-y-2">
                {(task.subtasks || []).map((st) => (
                  <li key={st.id} className="flex items-center gap-3 rounded-2xl border border-border bg-control px-4 py-3">
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => subtaskMutation.mutate({ action: 'toggle', subtask: { id: st.id, completed: !st.completed } })}
                    />
                    <span className={`flex-1 text-sm ${st.completed ? 'text-muted-foreground line-through' : ''}`}>{st.title}</span>
                    <button
                      type="button"
                      onClick={() => subtaskMutation.mutate({ action: 'delete', subtask: { id: st.id } })}
                      className="text-muted-foreground hover:text-danger"
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
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
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
                <p className="text-sm text-muted-foreground">No workflow history yet.</p>
              ) : (
                [...(task.workflowLog || [])].reverse().map((w) => (
                  <li key={w.id} className="rounded-2xl border border-border bg-control px-4 py-3 text-sm">
                    <p className="font-medium capitalize">{w.action.replace(/_/g, ' ')}</p>
                    <p className="text-muted-foreground">{w.note}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{w.userName} · {new Date(w.at).toLocaleString()}</p>
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
                  className="flex-1 rounded-2xl border border-border bg-control px-4 py-3 text-sm"
                />
                <button
                  type="button"
                  disabled={!comment.trim()}
                  onClick={() => commentMutation.mutate(comment.trim())}
                  className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-50"
                >
                  Send
                </button>
              </div>
              <ul className="space-y-3">
                {(task.comments || []).map((c) => (
                  <li key={c.id} className="rounded-2xl bg-muted px-4 py-3 text-sm">
                    <p className="font-medium">{c.userName}</p>
                    <p>{c.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</p>
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
