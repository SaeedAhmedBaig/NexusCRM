'use client';

import { use } from 'react';
import { DealDetail } from '../../../../../components/crm/deal-detail';
import { useSession } from '../../../../../components/providers/session-context';

export default function DealDetailPage({ params }) {
  const { id } = use(params);
  const { subdomain } = useSession();

  return <DealDetail dealId={id} subdomain={subdomain} />;
}
