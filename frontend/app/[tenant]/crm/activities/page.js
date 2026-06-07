'use client';

import { useEffect, useState } from 'react';
import { getRecentActivity } from '../../../../lib/api';
import { useSession } from '../../../../components/providers/session-context';
import { ActivityFeed } from '../../../../components/dashboard/activity-feed';
import { PageHeader } from '../../../../components/ui/page-header';
import { Spinner } from '../../../../components/ui/spinner';

export default function ActivitiesPage() {
  const { subdomain } = useSession();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecentActivity(50)
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Activities" description="Calls, emails, meetings, and notes across your workspace" />
      <ActivityFeed subdomain={subdomain} items={items} />
    </div>
  );
}
