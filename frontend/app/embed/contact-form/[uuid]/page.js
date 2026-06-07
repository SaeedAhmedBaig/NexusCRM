'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchPublicForm, submitPublicRequest } from '../../../../lib/public-api';
import { getRecaptchaToken, isRecaptchaEnabled } from '../../../../lib/recaptcha';

export default function EmbedContactFormPage() {
  const { uuid } = useParams();
  const [form, setForm] = useState(null);
  const [values, setValues] = useState({});
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPublicForm(uuid)
      .then((data) => {
        setForm(data);
        const init = {};
        (data.fields || []).forEach((f) => { init[f.key] = ''; });
        setValues(init);
        setStatus('ready');
      })
      .catch((e) => {
        setMessage(e.message);
        setStatus('error');
      });
  }, [uuid]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      let recaptchaToken = null;
      if (isRecaptchaEnabled()) {
        recaptchaToken = await getRecaptchaToken('contact_form');
      }
      await submitPublicRequest(uuid, { fields: values, recaptchaToken });
      setStatus('success');
      setMessage('Thank you! We received your message.');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (status === 'loading') {
    return <div className="flex min-h-[200px] items-center justify-center p-6 text-sm text-muted">Loading form…</div>;
  }

  if (status === 'error' && !form) {
    return <div className="p-6 text-sm text-danger">{message || 'Form not found'}</div>;
  }

  if (status === 'success') {
    return (
      <div className="p-6 text-center">
        <p className="text-lg font-semibold text-foreground">{message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-0 bg-transparent p-4 font-sans">
      <div className="mx-auto max-w-md">
        <h2 className="text-lg font-semibold text-foreground">{form.name}</h2>
        <p className="text-sm text-muted">{form.tenantName}</p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {(form.fields || []).map((field) => (
            <div key={field.key}>
              <label className="mb-1 block text-sm font-medium text-foreground">
                {field.label}{field.required ? ' *' : ''}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  required={field.required}
                  rows={4}
                  className="input-base w-full"
                  value={values[field.key] || ''}
                  onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                />
              ) : (
                <input
                  type={field.type || 'text'}
                  required={field.required}
                  className="input-base w-full"
                  value={values[field.key] || ''}
                  onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                />
              )}
            </div>
          ))}
          {message && status !== 'success' && <p className="text-sm text-danger">{message}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground hover:bg-brand-dark disabled:opacity-50"
          >
            {submitting ? 'Sending…' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}
