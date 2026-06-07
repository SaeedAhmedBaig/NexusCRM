'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { ClipboardList, CheckSquare, Mail } from 'lucide-react';
import { Modal } from './modal';
import { FormField, inputClass } from '../ui/form-field';
import { Button } from '../ui/button';
import { createDashboardRequest, createDashboardTask } from '../../lib/api';
import { createTask } from '../../lib/tasks-api';
import { notifySuccess, notifyError } from '../../lib/notify';
import { getTenantUrl } from '../../lib/tenant';

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export function QuickActions({ subdomain, onSuccess }) {
  const router = useRouter();
  const [modal, setModal] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const requestForm = useForm({ defaultValues: { title: '', description: '' } });
  const taskForm = useForm({ defaultValues: { title: '', dueDate: '', priority: 'medium', description: '' } });

  function closeModal() {
    setModal(null);
    setError('');
    setSubmitting(false);
  }

  async function handleRequest(data) {
    setSubmitting(true);
    setError('');
    try {
      await createDashboardRequest({
        title: data.title,
        description: data.description || undefined,
      });
      requestForm.reset();
      closeModal();
      notifySuccess('Request submitted');
      onSuccess?.();
    } catch (err) {
      setError(err.message);
      notifyError(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTask(data) {
    setSubmitting(true);
    setError('');
    try {
      await createTask({
        title: data.title,
        description: data.description || undefined,
        priority: data.priority,
        dueDate: data.dueDate || undefined,
        status: 'todo',
      });
      taskForm.reset();
      closeModal();
      notifySuccess('Task created');
      onSuccess?.();
    } catch (err) {
      setError(err.message);
      notifyError(err);
    } finally {
      setSubmitting(false);
    }
  }

  function openMassMail() {
    router.push(getTenantUrl(subdomain, '/massmail'));
  }

  const buttons = [
    { id: 'request', label: 'Add request', Icon: ClipboardList },
    { id: 'task', label: 'Create task', Icon: CheckSquare },
    { id: 'mail', label: 'Mass mail', Icon: Mail, action: openMassMail },
  ];

  return (
    <>
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {buttons.map((btn) => {
          const Icon = btn.Icon;
          return (
            <Button
              key={btn.id}
              type="button"
              variant="outline"
              onClick={btn.action || (() => setModal(btn.id))}
              className="gap-2"
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              {btn.label}
            </Button>
          );
        })}
      </div>

      <Modal open={modal === 'request'} title="Add request" onClose={closeModal}>
        <form onSubmit={requestForm.handleSubmit(handleRequest)} className="space-y-4">
          <FormField label="Title" required error={requestForm.formState.errors.title?.message}>
            <input
              className={inputClass}
              placeholder="What do you need?"
              {...requestForm.register('title', { required: 'Title is required' })}
            />
          </FormField>
          <FormField label="Description" hint="Optional details for reviewers">
            <textarea
              className={`${inputClass} min-h-[88px] resize-y`}
              placeholder="Add context…"
              {...requestForm.register('description')}
            />
          </FormField>
          {error && <p className="text-sm text-danger" role="alert">{error}</p>}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit request'}
          </Button>
        </form>
      </Modal>

      <Modal open={modal === 'task'} title="Create task" onClose={closeModal}>
        <form onSubmit={taskForm.handleSubmit(handleTask)} className="space-y-4">
          <FormField label="Task title" required error={taskForm.formState.errors.title?.message}>
            <input
              className={inputClass}
              placeholder="What needs to be done?"
              {...taskForm.register('title', { required: 'Title is required' })}
            />
          </FormField>
          <FormField label="Description">
            <textarea
              className={`${inputClass} min-h-[72px] resize-y`}
              placeholder="Optional notes…"
              {...taskForm.register('description')}
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Due date">
              <input type="date" className={inputClass} {...taskForm.register('dueDate')} />
            </FormField>
            <FormField label="Priority">
              <select className={inputClass} {...taskForm.register('priority')}>
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </FormField>
          </div>
          {error && <p className="text-sm text-danger" role="alert">{error}</p>}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create task'}
          </Button>
        </form>
      </Modal>
    </>
  );
}
