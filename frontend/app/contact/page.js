import { MarketingNav } from '../../components/marketing/marketing-nav';
import { Footer } from '../../components/marketing/footer';

export const metadata = {
  title: 'Contact Sales — NexusCRM',
};

export default function ContactPage() {
  return (
    <>
      <MarketingNav />
      <main className="mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-foreground">Contact sales</h1>
        <p className="mt-2 text-muted">
          Tell us about your team and we&apos;ll help you find the right plan.
        </p>
        <form className="mt-8 space-y-4" action="mailto:sales@nexuscrm.com">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground">Name</label>
            <input id="name" name="name" required className="mt-1 w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground">Work email</label>
            <input id="email" name="email" type="email" required className="mt-1 w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-foreground">Company</label>
            <input id="company" name="company" className="mt-1 w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-foreground">Message</label>
            <textarea id="message" name="message" rows={4} className="mt-1 w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <button type="submit" className="w-full rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-dark">
            Send message
          </button>
        </form>
      </main>
      <Footer />
    </>
  );
}
