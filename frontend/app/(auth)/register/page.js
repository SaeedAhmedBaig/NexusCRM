import { redirect } from 'next/navigation';

export default async function RegisterPage({ searchParams }) {
  const params = await searchParams;
  const plan = params?.plan || 'free';
  redirect(`/signup?plan=${plan}`);
}
