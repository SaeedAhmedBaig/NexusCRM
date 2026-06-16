'use client';

import { use } from 'react';
import { TicketDetail } from '../../../../../components/service/ticket-detail';
import { useSession } from '../../../../../components/providers/session-context';

export default function TicketDetailPage({ params }) {
  const { id } = use(params);
  const { subdomain } = useSession();

  return <TicketDetail ticketId={id} subdomain={subdomain} />;
}
