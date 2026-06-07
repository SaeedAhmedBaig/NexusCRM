'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Paperclip, Ticket } from 'lucide-react';
import { MemoEditor } from '../memos/MemoEditor';

export function EmailComposer({ open, onClose, onSend, defaultTo = '', defaultSubject = '', dealId, loading }) {
  const [bodyHtml, setBodyHtml] = useState('');
  const [schedule, setSchedule] = useState(false);
  const { register, handleSubmit, setValue, getValues } = useForm({
    defaultValues: {
      to: defaultTo,
      cc: '',
      bcc: '',
      subject: defaultSubject,
      scheduledAt: '',
    },
  });

  if (!open) return null;

  function insertTicket() {
    const ref = dealId ? dealId.slice(-6) : 'abc123';
    const current = getValues('subject') || '';
    if (!current.includes('[Ticket:')) {
      setValue('subject', `[Ticket: ${ref}] ${current}`.trim());
    }
  }

  async function onSubmit(values) {
    await onSend({
      ...values,
      bodyHtml,
      dealId,
      scheduledAt: schedule ? values.scheduledAt : undefined,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={handleSubmit(onSubmit)} className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold">Compose email</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-surface"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-3 overflow-y-auto p-5">
          <input {...register('to', { required: true })} placeholder="To" className="w-full rounded-xl border border-border px-3 py-2 text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <input {...register('cc')} placeholder="CC" className="rounded-xl border border-border px-3 py-2 text-sm" />
            <input {...register('bcc')} placeholder="BCC" className="rounded-xl border border-border px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-2">
            <input {...register('subject', { required: true })} placeholder="Subject" className="flex-1 rounded-xl border border-border px-3 py-2 text-sm" />
            <button type="button" onClick={insertTicket} className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-medium">
              <Ticket className="h-3.5 w-3.5" /> Ticket
            </button>
          </div>
          <MemoEditor content="" onChange={setBodyHtml} editable />
          <label className="flex items-center gap-2 text-sm text-muted">
            <Paperclip className="h-4 w-4" /> Attachments (coming soon)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={schedule} onChange={(e) => setSchedule(e.target.checked)} />
            Schedule send
          </label>
          {schedule && (
            <input type="datetime-local" {...register('scheduledAt')} className="w-full rounded-xl border border-border px-3 py-2 text-sm" />
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-border px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm">Cancel</button>
          <button type="submit" disabled={loading} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white">
            {loading ? 'Sending…' : schedule ? 'Schedule' : 'Send now'}
          </button>
        </div>
      </form>
    </div>
  );
}
