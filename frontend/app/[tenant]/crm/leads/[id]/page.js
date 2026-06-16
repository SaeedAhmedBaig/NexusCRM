'use client';

import { use } from 'react';
import { LeadDetail } from '../../../../../components/crm/lead-detail';
import { useSession } from '../../../../../components/providers/session-context';

export default function LeadDetailPage({ params }) {
  const { id } = use(params);
  const { subdomain } = useSession();

  return <LeadDetail leadId={id} subdomain={subdomain} />;
}
