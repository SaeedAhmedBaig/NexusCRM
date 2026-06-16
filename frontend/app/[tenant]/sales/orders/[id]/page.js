'use client';

import { use } from 'react';
import { SalesDocumentDetail } from '../../../../../components/sales/sales-document-detail';
import { useSession } from '../../../../../components/providers/session-context';

export default function OrderDetailPage({ params }) {
  const { id } = use(params);
  const { subdomain } = useSession();

  return <SalesDocumentDetail documentId={id} documentType="orders" subdomain={subdomain} />;
}
