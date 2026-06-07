import { redirect } from 'next/navigation';

export default async function RolesSettingsPage({ params }) {
  const { tenant } = await params;
  redirect(`/${tenant}/settings/departments`);
}
