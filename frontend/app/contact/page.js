import { MarketingNav } from '../../components/marketing/marketing-nav';
import { Footer } from '../../components/marketing/footer';
import { ContactForm } from '../../components/marketing/contact-form';

export const metadata = {
  title: 'Request a demo — NexusCRM',
  description: 'Schedule a guided demo or contact our sales team about NexusCRM for your organization.',
};

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
      <MarketingNav />
      <main className="flex-1">
        <section className="marketing-section">
          <div className="marketing-container">
            <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_420px] lg:items-start">
              <div className="min-w-0">
                <p className="marketing-eyebrow mb-4">Get demo</p>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  See NexusCRM in action
                </h1>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                  Request a guided walkthrough of multi-tenant workspaces, RBAC, pipeline analytics,
                  and enterprise governance — tailored to your team.
                </p>

                <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                    30-minute live demo with a solutions specialist
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                    Workspace provisioning and onboarding guidance
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                    Pricing and security review for procurement teams
                  </li>
                </ul>
              </div>

              <ContactForm
                type="demo"
                title="Request a demo"
                subtitle="We typically respond within one business day."
              />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
