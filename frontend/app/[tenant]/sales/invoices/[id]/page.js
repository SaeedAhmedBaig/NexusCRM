'use client';

import { use } from 'react';
import { SalesDocumentDetail } from '../../../../../components/sales/sales-document-detail';
import { useSession } from '../../../../../components/providers/session-context';

export default function InvoiceDetailPage({ params }) {
  const { id } = use(params);
  const { subdomain } = useSession();

  return <SalesDocumentDetail documentId={id} documentType="invoices" subdomain={subdomain} />;
}
