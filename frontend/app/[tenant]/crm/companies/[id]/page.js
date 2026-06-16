'use client';

import { use } from 'react';
import { AccountDetail } from '../../../../../components/crm/account-detail';
import { useSession } from '../../../../../components/providers/session-context';

export default function AccountDetailPage({ params }) {
  const { id } = use(params);
  const { subdomain } = useSession();

  return <AccountDetail companyId={id} subdomain={subdomain} />;
}
