'use client';

import { useState } from 'react';
import { Phone } from 'lucide-react';
import { initiateVoipCall } from '../../lib/voip-api';

export function PhoneDisplay({ value, contactId, companyId, className = '' }) {
  const [loading, setLoading] = useState(false);

  if (!value || value === '—') {
    return <span className="text-muted">—</span>;
  }

  async function handleCall(e) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      const result = await initiateVoipCall({ phone: value, contactId, companyId });
      if (result.dialUrl) {
        window.open(result.dialUrl, '_self');
      }
    } catch {
      window.open(`tel:${value}`, '_self');
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <a href={`tel:${value}`} className="text-foreground hover:text-brand" onClick={(e) => e.stopPropagation()}>
        {value}
      </a>
      <button
        type="button"
        onClick={handleCall}
        disabled={loading}
        title="Click to call"
        className="focus-ring inline-flex items-center gap-1 rounded-md border border-brand/20 bg-brand-subtle px-2 py-0.5 text-xs font-medium text-brand hover:bg-brand hover:text-brand-foreground disabled:opacity-50"
      >
        <Phone className="h-3 w-3" />
        {loading ? '…' : 'Call'}
      </button>
    </span>
  );
}
