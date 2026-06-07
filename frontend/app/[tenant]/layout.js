import { TenantGate } from '../../components/layout/tenant-gate';

export default async function TenantLayout({ children, params }) {
  const { tenant: subdomain } = await params;

  return <TenantGate subdomain={subdomain}>{children}</TenantGate>;
}
