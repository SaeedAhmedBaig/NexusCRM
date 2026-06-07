'use client';

import { useForm } from 'react-hook-form';

export function QuickAddTaskModal({ open, onClose, onCreate, projects, loading }) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { title: '', priority: 'medium', projectId: '', dueDate: '' },
  });

  if (!open) return null;

  async function onSubmit(values) {
    await onCreate({
      title: values.title,
      priority: values.priority,
      projectId: values.projectId || undefined,
      dueDate: values.dueDate || undefined,
    });
    reset();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={handleSubmit(onSubmit)} className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-semibold">New task</h3>
        <div className="space-y-3">
          <input
            {...register('title', { required: true })}
            placeholder="Task title"
            className="w-full rounded-xl border border-border px-3 py-2 text-sm"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <select {...register('priority')} className="rounded-xl border border-border px-3 py-2 text-sm capitalize">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <input type="date" {...register('dueDate')} className="rounded-xl border border-border px-3 py-2 text-sm" />
          </div>
          <select {...register('projectId')} className="w-full rounded-xl border border-border px-3 py-2 text-sm">
            <option value="">No project</option>
            {(projects || []).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm">Cancel</button>
          <button type="submit" disabled={loading} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white">
            {loading ? 'Creating…' : 'Create task'}
          </button>
        </div>
      </form>
    </div>
  );
}
