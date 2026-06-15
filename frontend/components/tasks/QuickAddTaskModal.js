'use client';

import { useForm } from 'react-hook-form';

export function QuickAddTaskModal({ open, onClose, onCreate, projects, loading }) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { title: '', description: '', nextStep: '', priority: 'medium', projectId: '', dueDate: '' },
  });

  if (!open) return null;

  async function onSubmit(values) {
    await onCreate({
      title: values.title,
      description: values.description || undefined,
      nextStep: values.nextStep || undefined,
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
      <form onSubmit={handleSubmit(onSubmit)} className="relative w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-lg">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Quick add</p>
        <h3 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">New task card</h3>
        <div className="mt-5 space-y-3">
          <input
            {...register('title', { required: true })}
            placeholder="Task title"
            className="w-full rounded-md border border-border bg-control px-4 py-3 text-sm"
            autoFocus
          />
          <textarea
            {...register('description')}
            placeholder="Description or acceptance criteria"
            rows={3}
            className="w-full resize-y rounded-md border border-border bg-control px-4 py-3 text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <select {...register('priority')} className="rounded-md border border-border bg-control px-4 py-3 text-sm capitalize">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <input type="date" {...register('dueDate')} className="rounded-md border border-border bg-control px-4 py-3 text-sm" />
          </div>
          <select {...register('projectId')} className="w-full rounded-md border border-border bg-control px-4 py-3 text-sm">
            <option value="">No project</option>
            {(projects || []).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input
            {...register('nextStep')}
            placeholder="Next step after this card is created"
            className="w-full rounded-md border border-border bg-control px-4 py-3 text-sm"
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="h-10 rounded-md border border-border bg-control px-5 text-sm font-semibold">Cancel</button>
          <button type="submit" disabled={loading} className="h-10 rounded-md bg-brand px-5 text-sm font-semibold text-brand-foreground">
            {loading ? 'Creating…' : 'Create task'}
          </button>
        </div>
      </form>
    </div>
  );
}
