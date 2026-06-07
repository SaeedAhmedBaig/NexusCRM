import Link from 'next/link';
import { MarketingNav } from '../../components/marketing/marketing-nav';
import { Footer } from '../../components/marketing/footer';

export const metadata = {
  title: 'Terms of Service — NexusCRM',
};

export default function TermsPage() {
  return (
    <>
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted">Last updated: June 2026</p>
        <div className="mt-8 space-y-6 text-muted">
          <p>
            By using NexusCRM, you agree to these terms. You are responsible for your account
            credentials and all activity under your workspace.
          </p>
          <h2 className="text-xl font-semibold text-foreground">Subscriptions</h2>
          <p>
            Paid plans renew automatically unless cancelled. Free trials convert to paid plans unless
            you downgrade before the trial ends.
          </p>
          <h2 className="text-xl font-semibold text-foreground">Acceptable use</h2>
          <p>
            You may not use the platform for spam, unlawful activity, or to harm other users.
            We may suspend accounts that violate these terms.
          </p>
          <p>
            <Link href="/contact" className="text-brand hover:underline">Contact us</Link> with questions.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
