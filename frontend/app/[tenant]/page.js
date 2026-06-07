import { redirect } from 'next/navigation';

export default async function TenantHomePage({ params }) {
  const { tenant: subdomain } = await params;
  redirect(`/${subdomain}/dashboard`);
}
