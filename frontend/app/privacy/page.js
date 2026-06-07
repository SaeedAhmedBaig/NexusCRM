import Link from 'next/link';
import { MarketingNav } from '../../components/marketing/marketing-nav';
import { Footer } from '../../components/marketing/footer';

export const metadata = {
  title: 'Privacy Policy — NexusCRM',
};

export default function PrivacyPage() {
  return (
    <>
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted">Last updated: June 2026</p>
        <div className="prose prose-slate mt-8 max-w-none space-y-6 text-muted">
          <p>
            NexusCRM (&quot;we&quot;, &quot;our&quot;) respects your privacy. This policy describes how we
            collect, use, and protect personal data when you use our CRM platform.
          </p>
          <h2 className="text-xl font-semibold text-foreground">Data we collect</h2>
          <p>
            Account information (name, email), workspace data you enter into the CRM, usage analytics,
            and billing details for paid plans.
          </p>
          <h2 className="text-xl font-semibold text-foreground">How we use data</h2>
          <p>
            To provide the service, improve features, send transactional emails, and comply with legal
            obligations. We do not sell your data.
          </p>
          <h2 className="text-xl font-semibold text-foreground">Contact</h2>
          <p>
            Questions? <Link href="/contact" className="text-brand hover:underline">Contact us</Link>.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
